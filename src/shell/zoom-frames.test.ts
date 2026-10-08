import { describe, expect, it } from "vitest";
import {
  isDrawable,
  rectText,
  zoomDurationMs,
  zoomFrames,
  zoomSteps,
  type Rect,
} from "./zoom-frames";

const icon: Rect = { x: 10, y: 20, width: 40, height: 50 };
const window_: Rect = { x: 170, y: 100, width: 800, height: 450 };

describe("zoomFrames", () => {
  it("starts at the first rectangle and ends at the second", () => {
    const frames = zoomFrames(icon, window_);
    expect(frames).toHaveLength(zoomSteps + 1);
    expect(frames[0]).toEqual(icon);
    expect(frames.at(-1)).toEqual(window_);
  });

  it("moves in even steps and whole pixels", () => {
    const frames = zoomFrames(
      { x: 0, y: 0, width: 0, height: 0 },
      { x: 80, y: 40, width: 160, height: 80 },
      4,
    );
    expect(frames.map((frame) => frame.x)).toEqual([0, 20, 40, 60, 80]);
    expect(frames.map((frame) => frame.width)).toEqual([0, 40, 80, 120, 160]);
    for (const frame of zoomFrames(icon, window_)) {
      for (const value of Object.values(frame)) expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("runs backwards for a window that closes", () => {
    expect(zoomFrames(window_, icon)).toEqual(zoomFrames(icon, window_).reverse());
  });

  it("stays put between two equal rectangles", () => {
    for (const frame of zoomFrames(icon, icon)) expect(frame).toEqual(icon);
  });

  it("has at least one step, whatever it is asked for", () => {
    for (const steps of [0, -3, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const frames = zoomFrames(icon, window_, steps);
      expect(frames.length).toBeGreaterThanOrEqual(2);
      expect(frames[0]).toEqual(icon);
      expect(frames.at(-1)).toEqual(window_);
    }
  });

  it("is short enough: a quarter of a second at most", () => {
    expect(zoomDurationMs).toBeLessThanOrEqual(250);
  });
});

describe("isDrawable", () => {
  it("needs a finite size above zero", () => {
    expect(isDrawable(icon)).toBe(true);
    expect(isDrawable({ ...icon, width: 0 })).toBe(false);
    expect(isDrawable({ ...icon, height: -1 })).toBe(false);
    expect(isDrawable({ ...icon, x: Number.NaN })).toBe(false);
  });
});

describe("rectText", () => {
  it("lists the rounded numbers", () => {
    expect(rectText({ x: 1.4, y: 2.6, width: 3, height: 4 })).toBe("1 3 3 4");
  });
});
