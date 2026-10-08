import { describe, expect, it } from "vitest";
import {
  effectiveAnimations,
  parseChoice,
  readChoice,
  reducedMotionLabel,
  saveChoice,
  toggleView,
  type ChoiceStore,
} from "./animation-preference";

const fakeStore = (): ChoiceStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => void data.set(name, value),
  };
};

const throwingStore: ChoiceStore = {
  getItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
  setItem: () => {
    throw new DOMException("full", "QuotaExceededError");
  },
};

describe("effectiveAnimations", () => {
  it.each([
    [false, null, "on"],
    [false, "on", "on"],
    [false, "off", "off"],
    [true, null, "off"],
    [true, "on", "off"],
    [true, "off", "off"],
  ] as const)("reduced motion %s and choice %s gives %s", (osReducedMotion, choice, expected) => {
    expect(effectiveAnimations({ osReducedMotion, choice })).toBe(expected);
  });
});

describe("stored choice", () => {
  it("round-trips both values", () => {
    const store = fakeStore();
    saveChoice(store, "off");
    expect(readChoice(store)).toBe("off");
    saveChoice(store, "on");
    expect(readChoice(store)).toBe("on");
  });

  it("reads nothing when nothing was saved or there is no store", () => {
    expect(readChoice(fakeStore())).toBeNull();
    expect(readChoice(null)).toBeNull();
  });

  it.each(["ON", "true", "1", "", " off", "null", "undefined"])("rejects the text %j", (text) => {
    const store = fakeStore();
    store.data.set("desktop-animations", text);
    expect(readChoice(store)).toBeNull();
    expect(parseChoice(text)).toBeNull();
  });

  it("rejects values that are not text", () => {
    for (const value of [null, undefined, 1, true, {}, ["on"]])
      expect(parseChoice(value)).toBeNull();
  });

  it("does not throw when storage is blocked", () => {
    expect(readChoice(throwingStore)).toBeNull();
    expect(() => saveChoice(throwingStore, "off")).not.toThrow();
  });
});

describe("toggleView", () => {
  it("is pressed and usable when animations are on", () => {
    expect(toggleView({ osReducedMotion: false, choice: null })).toEqual({
      pressed: true,
      disabled: false,
      label: "Animations",
      announcement: "Animations on",
    });
  });

  it("is not pressed but usable when the visitor turned animations off", () => {
    const view = toggleView({ osReducedMotion: false, choice: "off" });
    expect(view.pressed).toBe(false);
    expect(view.disabled).toBe(false);
    expect(view.announcement).toBe("Animations off");
  });

  it("is disabled and says why when the device asks for reduced motion, whatever was chosen", () => {
    for (const choice of [null, "on", "off"] as const) {
      const view = toggleView({ osReducedMotion: true, choice });
      expect(view.pressed).toBe(false);
      expect(view.disabled).toBe(true);
      expect(view.label).toBe(reducedMotionLabel);
    }
  });
});
