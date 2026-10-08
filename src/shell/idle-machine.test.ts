import { describe, expect, it } from "vitest";
import {
  idleTimeoutMs,
  msUntilIdle,
  nextIdleState,
  startCounting,
  type IdleEvent,
  type IdleState,
} from "./idle-machine";

const counting = startCounting(0);
const saver: IdleState = { phase: "saver", lastActivityAt: 0 };
const run = (state: IdleState, ...events: IdleEvent[]) =>
  events.reduce((current, event) => nextIdleState(current, event), state);

describe("counting", () => {
  it("starts the saver once the timeout has passed with nothing happening", () => {
    expect(nextIdleState(counting, { type: "tick", at: idleTimeoutMs, allowed: true }).phase).toBe(
      "saver",
    );
  });

  it("does not start before the timeout", () => {
    expect(nextIdleState(counting, { type: "tick", at: idleTimeoutMs - 1, allowed: true })).toBe(
      counting,
    );
  });

  it("starts counting again at every activity", () => {
    const state = run(counting, { type: "activity", at: 80_000 });
    expect(state).toEqual(startCounting(80_000));
    expect(nextIdleState(state, { type: "tick", at: 100_000, allowed: true }).phase).toBe(
      "counting",
    );
    expect(nextIdleState(state, { type: "tick", at: 170_000, allowed: true }).phase).toBe("saver");
  });

  it("never starts when it is not allowed, and the time does not count", () => {
    const blocked = nextIdleState(counting, { type: "tick", at: 200_000, allowed: false });
    expect(blocked).toEqual(startCounting(200_000));
    expect(nextIdleState(blocked, { type: "tick", at: 200_001, allowed: true }).phase).toBe(
      "counting",
    );
  });

  it("starts on request, and only if allowed", () => {
    expect(nextIdleState(counting, { type: "request", at: 5, allowed: true }).phase).toBe("saver");
    expect(nextIdleState(counting, { type: "request", at: 5, allowed: false })).toBe(counting);
  });

  it("ignores a hidden page until it is visible again, which restarts the count", () => {
    expect(nextIdleState(counting, { type: "hidden", at: 10 })).toBe(counting);
    expect(nextIdleState(counting, { type: "visible", at: 50_000 })).toEqual(startCounting(50_000));
  });
});

describe("saver", () => {
  it("is dismissed by the first activity", () => {
    expect(nextIdleState(saver, { type: "activity", at: 91_000 })).toEqual({
      phase: "dismissed",
      lastActivityAt: 91_000,
    });
  });

  it("stops when the page is hidden", () => {
    expect(nextIdleState(saver, { type: "hidden", at: 1 }).phase).toBe("dismissed");
  });

  it("stops when it stops being allowed, and carries on while it is", () => {
    expect(nextIdleState(saver, { type: "tick", at: 1, allowed: false }).phase).toBe("dismissed");
    expect(nextIdleState(saver, { type: "tick", at: 1, allowed: true })).toBe(saver);
  });

  it("ignores a second request and a visible event", () => {
    expect(nextIdleState(saver, { type: "request", at: 1, allowed: true })).toBe(saver);
    expect(nextIdleState(saver, { type: "visible", at: 1 })).toBe(saver);
  });
});

describe("dismissed", () => {
  const dismissed: IdleState = { phase: "dismissed", lastActivityAt: 91_000 };

  it("counts again from the next activity, tick or visible event", () => {
    expect(nextIdleState(dismissed, { type: "activity", at: 92_000 })).toEqual(
      startCounting(92_000),
    );
    expect(nextIdleState(dismissed, { type: "tick", at: 93_000, allowed: true })).toEqual(
      startCounting(93_000),
    );
    expect(nextIdleState(dismissed, { type: "hidden", at: 94_000 })).toEqual(startCounting(94_000));
  });

  it("can start again on request", () => {
    expect(nextIdleState(dismissed, { type: "request", at: 1, allowed: true }).phase).toBe("saver");
  });
});

describe("msUntilIdle", () => {
  it("is the time left, and never negative", () => {
    expect(msUntilIdle(startCounting(1000), 31_000)).toBe(idleTimeoutMs - 30_000);
    expect(msUntilIdle(startCounting(0), idleTimeoutMs * 2)).toBe(0);
  });
});
