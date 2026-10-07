import { describe, expect, it } from "vitest";
import {
  nextIconSelection,
  nothingSelected,
  type IconSelection,
  type PointerKind,
} from "./icon-selection";

const selected = (id: string): IconSelection => ({ selected: id });
const activate = (state: IconSelection, id: string, pointer: PointerKind) =>
  nextIconSelection(state, { type: "activate", id, pointer });

describe("nextIconSelection", () => {
  it("selects an icon on a single mouse click without opening it", () => {
    expect(activate(nothingSelected, "a", "mouse")).toEqual({ state: selected("a"), open: null });
  });

  it("moves the selection when another icon is clicked with the mouse", () => {
    expect(activate(selected("a"), "b", "mouse")).toEqual({ state: selected("b"), open: null });
  });

  it("opens an icon that is already selected, which makes a double click open it", () => {
    expect(activate(selected("a"), "a", "mouse")).toEqual({ state: selected("a"), open: "a" });
  });

  it.each(["touch", "pen", "keyboard", "unknown"] as const)(
    "opens at once for %s, so nobody needs a second action",
    (pointer) => {
      expect(activate(nothingSelected, "a", pointer)).toEqual({
        state: selected("a"),
        open: "a",
      });
    },
  );

  it("clears the selection when the click lands elsewhere", () => {
    expect(nextIconSelection(selected("a"), { type: "click-elsewhere" })).toEqual({
      state: nothingSelected,
      open: null,
    });
  });

  it("leaves an empty selection alone when the click lands elsewhere", () => {
    const result = nextIconSelection(nothingSelected, { type: "click-elsewhere" });
    expect(result.state).toBe(nothingSelected);
    expect(result.open).toBeNull();
  });
});
