import { describe, expect, it } from "vitest";
import { minimumBusyMs, remainingBusyMs } from "./busy-state";

describe("remainingBusyMs", () => {
  it("keeps the cursor for the rest of the minimum after a fast load", () => {
    expect(remainingBusyMs(1000, 1050, true)).toBe(minimumBusyMs - 50);
    expect(remainingBusyMs(1000, 1000, true)).toBe(minimumBusyMs);
  });

  it("adds nothing once the minimum has passed", () => {
    expect(remainingBusyMs(1000, 1000 + minimumBusyMs, true)).toBe(0);
    expect(remainingBusyMs(1000, 5000, true)).toBe(0);
  });

  it("adds nothing with animations off, however fast the load", () => {
    expect(remainingBusyMs(1000, 1001, false)).toBe(0);
  });

  it("is never negative or above the minimum, even if the clock went back", () => {
    expect(remainingBusyMs(1000, 500, true)).toBe(minimumBusyMs);
    expect(remainingBusyMs(1000, 1000, true, 0)).toBe(0);
  });
});
