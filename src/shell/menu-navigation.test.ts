import { describe, expect, it } from "vitest";
import { nextMenuAction, type MenuContext } from "./menu-navigation";

const open = (activeIndex: number | null, itemCount = 4): MenuContext => ({
  isOpen: true,
  activeIndex,
  itemCount,
});
const closed: MenuContext = { isOpen: false, activeIndex: null, itemCount: 4 };

describe("nextMenuAction, menu closed", () => {
  it("opens on the first item with ArrowDown and on the last with ArrowUp", () => {
    expect(nextMenuAction("ArrowDown", closed)).toEqual({ type: "open", focusIndex: 0 });
    expect(nextMenuAction("ArrowUp", closed)).toEqual({ type: "open", focusIndex: 3 });
  });

  it("leaves every other key to the browser, Enter and Space included", () => {
    for (const key of ["Enter", " ", "Escape", "Home", "a"]) {
      expect(nextMenuAction(key, closed)).toEqual({ type: "none" });
    }
  });

  it("does nothing when there are no items", () => {
    expect(nextMenuAction("ArrowDown", { ...closed, itemCount: 0 })).toEqual({ type: "none" });
  });
});

describe("nextMenuAction, focus on the Start button of an open menu", () => {
  it("moves to the first item with ArrowDown and to the last with ArrowUp", () => {
    expect(nextMenuAction("ArrowDown", open(null))).toEqual({ type: "focus", index: 0 });
    expect(nextMenuAction("ArrowUp", open(null))).toEqual({ type: "focus", index: 3 });
  });

  it("jumps with Home and End", () => {
    expect(nextMenuAction("Home", open(null))).toEqual({ type: "focus", index: 0 });
    expect(nextMenuAction("End", open(null))).toEqual({ type: "focus", index: 3 });
  });

  it("does not activate anything with Space, because the browser toggles the menu", () => {
    expect(nextMenuAction(" ", open(null))).toEqual({ type: "none" });
  });
});

describe("nextMenuAction, focus on an item", () => {
  it("moves down and up, and wraps at both ends", () => {
    expect(nextMenuAction("ArrowDown", open(1))).toEqual({ type: "focus", index: 2 });
    expect(nextMenuAction("ArrowDown", open(3))).toEqual({ type: "focus", index: 0 });
    expect(nextMenuAction("ArrowUp", open(2))).toEqual({ type: "focus", index: 1 });
    expect(nextMenuAction("ArrowUp", open(0))).toEqual({ type: "focus", index: 3 });
  });

  it("jumps to the first and last item with Home and End", () => {
    expect(nextMenuAction("Home", open(2))).toEqual({ type: "focus", index: 0 });
    expect(nextMenuAction("End", open(1))).toEqual({ type: "focus", index: 3 });
  });

  it("activates the focused item with Space and leaves Enter to the link", () => {
    expect(nextMenuAction(" ", open(2))).toEqual({ type: "activate", index: 2 });
    expect(nextMenuAction("Enter", open(2))).toEqual({ type: "none" });
  });

  it("closes with Escape from an item and from the Start button", () => {
    expect(nextMenuAction("Escape", open(2))).toEqual({ type: "close" });
    expect(nextMenuAction("Escape", open(null))).toEqual({ type: "close" });
  });

  it("ignores keys that mean nothing to the menu", () => {
    expect(nextMenuAction("a", open(1))).toEqual({ type: "none" });
    expect(nextMenuAction("Tab", open(1))).toEqual({ type: "none" });
  });

  it("copes with an empty menu, which can still be closed", () => {
    expect(nextMenuAction("ArrowDown", open(null, 0))).toEqual({ type: "none" });
    expect(nextMenuAction("Escape", open(null, 0))).toEqual({ type: "close" });
  });
});
