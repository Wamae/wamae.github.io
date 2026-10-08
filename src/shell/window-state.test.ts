import { describe, expect, it } from "vitest";
import {
  maximizeAnnouncement,
  nextWindow,
  nextWindowState,
  noWindow,
  type WindowModel,
  windowAnnouncement,
  type WindowEvent,
  type WindowState,
} from "./window-state";

const navigateToSection: WindowEvent = { type: "navigate", target: "section" };
const navigateToDesktop: WindowEvent = { type: "navigate", target: "desktop" };

describe("nextWindowState", () => {
  it.each<[WindowState, WindowEvent, WindowState]>([
    ["open", { type: "minimize" }, "minimized"],
    ["open", { type: "close" }, "closed"],
    ["open", { type: "toggle" }, "minimized"],
    ["minimized", { type: "restore" }, "open"],
    ["minimized", { type: "toggle" }, "open"],
    ["open", navigateToSection, "open"],
    ["minimized", navigateToSection, "open"],
    ["closed", navigateToSection, "open"],
    ["open", navigateToDesktop, "closed"],
    ["minimized", navigateToDesktop, "closed"],
    ["closed", navigateToDesktop, "closed"],
  ])("%s then %j gives %s", (state, event, expected) => {
    expect(nextWindowState(state, event)).toBe(expected);
  });

  it.each<[WindowState, WindowEvent]>([
    ["minimized", { type: "minimize" }],
    ["closed", { type: "minimize" }],
    ["open", { type: "restore" }],
    ["closed", { type: "restore" }],
    ["closed", { type: "toggle" }],
    ["minimized", { type: "close" }],
    ["closed", { type: "close" }],
  ])("%s ignores %j", (state, event) => {
    expect(nextWindowState(state, event)).toBe(state);
  });
});

describe("windowAnnouncement", () => {
  it("names each change that a person needs to hear", () => {
    expect(windowAnnouncement("open", "minimized", "Projects")).toBe("Projects minimized");
    expect(windowAnnouncement("minimized", "open", "Projects")).toBe("Projects restored");
    expect(windowAnnouncement("open", "closed", "Projects")).toBe("Projects closed");
    expect(windowAnnouncement("minimized", "closed", "Projects")).toBe("Projects closed");
  });

  it("says nothing when nothing changed or when a window opens", () => {
    expect(windowAnnouncement("open", "open", "Projects")).toBeNull();
    expect(windowAnnouncement("closed", "closed", "Projects")).toBeNull();
    expect(windowAnnouncement("closed", "open", "Projects")).toBeNull();
  });
});

describe("nextWindow, maximizing", () => {
  const open: WindowModel = { state: "open", maximized: false };
  const maximized: WindowModel = { state: "open", maximized: true };
  const toggle: WindowEvent = { type: "toggle-maximize" };

  it("toggles while the window is open", () => {
    expect(nextWindow(open, toggle)).toEqual(maximized);
    expect(nextWindow(maximized, toggle)).toEqual(open);
  });

  it("keeps the maximized flag through minimize, restore and the taskbar toggle", () => {
    const minimized = nextWindow(maximized, { type: "minimize" });
    expect(minimized).toEqual({ state: "minimized", maximized: true });
    expect(nextWindow(minimized, { type: "restore" })).toEqual(maximized);
    expect(nextWindow(nextWindow(maximized, { type: "toggle" }), { type: "toggle" })).toEqual(
      maximized,
    );
  });

  it("keeps the flag when a section opens while minimized", () => {
    const minimized: WindowModel = { state: "minimized", maximized: true };
    expect(nextWindow(minimized, { type: "navigate", target: "section" })).toEqual(maximized);
  });

  it("resets the flag when the window closes, however it closes", () => {
    expect(nextWindow(maximized, { type: "close" })).toEqual(noWindow);
    expect(nextWindow(maximized, { type: "navigate", target: "desktop" })).toEqual(noWindow);
    const minimized: WindowModel = { state: "minimized", maximized: true };
    expect(nextWindow(minimized, { type: "navigate", target: "desktop" })).toEqual(noWindow);
    const reopened = nextWindow(noWindow, { type: "navigate", target: "section" });
    expect(reopened).toEqual(open);
  });

  it("ignores the toggle while minimized or closed", () => {
    const minimized: WindowModel = { state: "minimized", maximized: true };
    expect(nextWindow(minimized, toggle)).toEqual(minimized);
    expect(nextWindow({ state: "minimized", maximized: false }, toggle).maximized).toBe(false);
    expect(nextWindow(noWindow, toggle)).toEqual(noWindow);
  });

  it("changes visibility like nextWindowState does", () => {
    expect(nextWindow(open, { type: "minimize" }).state).toBe("minimized");
    expect(nextWindow(open, { type: "restore" })).toEqual(open);
    expect(nextWindow(noWindow, { type: "minimize" })).toEqual(noWindow);
  });
});

describe("maximizeAnnouncement", () => {
  it("says maximized or restored to normal size, which differs from restored after minimize", () => {
    expect(maximizeAnnouncement(true, "Projects")).toBe("Projects maximized");
    expect(maximizeAnnouncement(false, "Projects")).toBe("Projects restored to normal size");
    expect(windowAnnouncement("minimized", "open", "Projects")).toBe("Projects restored");
  });
});
