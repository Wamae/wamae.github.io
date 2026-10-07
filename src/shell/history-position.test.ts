import { describe, expect, it } from "vitest";
import {
  afterOpeningPage,
  afterTraversal,
  canGoBack,
  canGoForward,
  firstPosition,
  readPosition,
  restorePosition,
  writePosition,
} from "./history-position";

describe("history position", () => {
  it("starts with nothing to go back or forward to", () => {
    expect(canGoBack(firstPosition)).toBe(false);
    expect(canGoForward(firstPosition)).toBe(false);
  });

  it("allows Back after a page is opened", () => {
    const next = afterOpeningPage(firstPosition);
    expect(next).toEqual({ index: 1, length: 2 });
    expect(canGoBack(next)).toBe(true);
    expect(canGoForward(next)).toBe(false);
  });

  it("allows Forward in the middle of the entries", () => {
    const middle = { index: 1, length: 3 };
    expect(canGoBack(middle)).toBe(true);
    expect(canGoForward(middle)).toBe(true);
  });

  it("drops the forward entries when a page is opened from the middle", () => {
    expect(afterOpeningPage({ index: 1, length: 3 })).toEqual({ index: 2, length: 3 });
    expect(afterOpeningPage({ index: 0, length: 4 })).toEqual({ index: 1, length: 2 });
  });

  it("keeps Forward available after going Back, although the entry stored an older length", () => {
    const known = { index: 2, length: 3 };
    const back = afterTraversal(known, { index: 1, length: 2 });
    expect(back).toEqual({ index: 1, length: 3 });
    expect(canGoForward(back)).toBe(true);
    expect(afterTraversal(back, { index: 2, length: 3 })).toEqual({ index: 2, length: 3 });
  });

  it("round-trips through history.state", () => {
    const position = { index: 2, length: 4 };
    expect(readPosition(writePosition(position))).toEqual(position);
  });

  it.each([null, undefined, 3, "x", {}, { desktop: null }, { desktop: { index: "1", length: 2 } }])(
    "rejects an unexpected state: %j",
    (state) => {
      expect(readPosition(state)).toBeNull();
    },
  );

  it("rejects positions that cannot exist", () => {
    expect(readPosition({ desktop: { index: -1, length: 2 } })).toBeNull();
    expect(readPosition({ desktop: { index: 2, length: 2 } })).toBeNull();
    expect(readPosition({ desktop: { index: 1.5, length: 3 } })).toBeNull();
  });

  describe("restorePosition after a reload", () => {
    it("starts afresh when no position was stored", () => {
      expect(restorePosition(null, 5, 9)).toEqual(firstPosition);
    });

    it("uses the saved length so Forward stays available mid-history", () => {
      const restored = restorePosition({ index: 1, length: 2 }, 3, 9);
      expect(restored).toEqual({ index: 1, length: 3 });
      expect(canGoForward(restored)).toBe(true);
    });

    it("ignores a saved length larger than the entries the browser has", () => {
      expect(restorePosition({ index: 1, length: 2 }, 999, 4)).toEqual({ index: 1, length: 2 });
      expect(restorePosition({ index: 1, length: 2 }, 4, 4)).toEqual({ index: 1, length: 4 });
    });

    it("falls back to the stored length when the saved one is missing or impossible", () => {
      expect(restorePosition({ index: 1, length: 2 }, null, 9)).toEqual({ index: 1, length: 2 });
      expect(restorePosition({ index: 2, length: 3 }, 1, 9)).toEqual({ index: 2, length: 3 });
      expect(restorePosition({ index: 1, length: 2 }, 2.5, 9)).toEqual({ index: 1, length: 2 });
    });
  });
});
