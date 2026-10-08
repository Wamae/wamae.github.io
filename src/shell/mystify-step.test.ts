import { describe, expect, it } from "vitest";
import {
  createMystify,
  isFrameDue,
  minFrameIntervalMs,
  resizeMystify,
  stepMystify,
  trailLength,
  type Mystify,
  type Random,
} from "./mystify-step";

/** A small deterministic generator, so the test needs no real randomness. */
function seeded(seed: number): Random {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const inside = (state: Mystify) =>
  state.shapes.every((shape) =>
    [...shape.vertices, ...shape.trail.flat()].every(
      (p) => p.x >= 0 && p.x <= state.width && p.y >= 0 && p.y <= state.height,
    ),
  );

describe("createMystify", () => {
  it("makes two shapes of four corners inside the screen", () => {
    const state = createMystify(800, 600, seeded(1));
    expect(state.shapes).toHaveLength(2);
    for (const shape of state.shapes) expect(shape.vertices).toHaveLength(4);
    expect(inside(state)).toBe(true);
  });

  it("is the same for the same random numbers and different for others", () => {
    expect(createMystify(800, 600, seeded(7))).toEqual(createMystify(800, 600, seeded(7)));
    expect(createMystify(800, 600, seeded(7))).not.toEqual(createMystify(800, 600, seeded(8)));
  });

  it("copes with a screen of no size", () => {
    expect(inside(createMystify(0, -5, seeded(3)))).toBe(true);
  });
});

describe("stepMystify", () => {
  it("keeps every corner and trail point inside, over many frames and big steps", () => {
    let state = createMystify(320, 200, seeded(5));
    for (let frame = 0; frame < 2000; frame++) {
      state = stepMystify(state, frame % 50 === 0 ? 5000 : 33);
      expect(inside(state)).toBe(true);
    }
  });

  it("is deterministic: the same state and step give the same result", () => {
    const state = createMystify(500, 500, seeded(11));
    expect(stepMystify(state, 33)).toEqual(stepMystify(state, 33));
  });

  it("does not change the state it was given", () => {
    const state = createMystify(500, 500, seeded(11));
    const copy = structuredClone(state);
    stepMystify(state, 33);
    expect(state).toEqual(copy);
  });

  it("moves the corners and grows a trail that stops at its length", () => {
    let state = createMystify(500, 500, seeded(2));
    const start = state.shapes[0].vertices[0];
    for (let frame = 0; frame < 20; frame++) state = stepMystify(state, 33);
    expect(state.shapes[0].vertices[0]).not.toEqual(start);
    expect(state.shapes[0].trail).toHaveLength(trailLength);
  });

  it("does not move for no time or for a clock that went back", () => {
    const state = createMystify(500, 500, seeded(2));
    expect(stepMystify(state, 0).shapes[0].vertices).toEqual(state.shapes[0].vertices);
    expect(stepMystify(state, -100).shapes[0].vertices).toEqual(state.shapes[0].vertices);
  });
});

describe("resizeMystify", () => {
  it("pulls corners into a smaller screen", () => {
    const state = resizeMystify(createMystify(1000, 800, seeded(4)), 100, 100);
    expect(state.width).toBe(100);
    expect(inside(state)).toBe(true);
    expect(state.shapes[0].trail).toEqual([]);
  });
});

describe("isFrameDue", () => {
  it("allows the first frame, then at most about 30 a second", () => {
    expect(isFrameDue(null, 0)).toBe(true);
    expect(isFrameDue(1000, 1000 + minFrameIntervalMs - 1)).toBe(false);
    expect(isFrameDue(1000, 1000 + minFrameIntervalMs)).toBe(true);
    expect(minFrameIntervalMs).toBeGreaterThanOrEqual(33);
  });
});
