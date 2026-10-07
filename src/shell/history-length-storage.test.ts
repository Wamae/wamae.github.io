import { describe, expect, it } from "vitest";
import { readSavedLength, saveLength, type LengthStore } from "./history-length-storage";

const fakeStore = (): LengthStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => void data.set(name, value),
  };
};

describe("history length storage", () => {
  it("round-trips a length", () => {
    const store = fakeStore();
    saveLength(store, 4);
    expect(readSavedLength(store)).toBe(4);
  });

  it("reads nothing when nothing was saved or there is no store", () => {
    expect(readSavedLength(fakeStore())).toBeNull();
    expect(readSavedLength(null)).toBeNull();
  });

  it.each(["1e3", " 7 ", "0x10", "-2", "2.5", "", "abc"])("rejects the saved text %j", (text) => {
    const store = fakeStore();
    store.data.set("desktop-history-length", text);
    expect(readSavedLength(store)).toBeNull();
  });

  it("survives a store that throws", () => {
    const blocked: LengthStore = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readSavedLength(blocked)).toBeNull();
    expect(() => saveLength(blocked, 2)).not.toThrow();
  });
});
