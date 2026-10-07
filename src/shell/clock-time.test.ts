import { describe, expect, it } from "vitest";
import { formatClockTime, millisecondsToNextMinute } from "./clock-time";

describe("clock time", () => {
  it("formats hours and minutes with leading zeros", () => {
    expect(formatClockTime(new Date(2026, 9, 7, 9, 5, 30))).toBe("09:05");
    expect(formatClockTime(new Date(2026, 9, 7, 0, 0, 0))).toBe("00:00");
    expect(formatClockTime(new Date(2026, 9, 7, 23, 59, 59))).toBe("23:59");
  });

  it("counts the time left in the current minute", () => {
    expect(millisecondsToNextMinute(new Date(2026, 9, 7, 9, 5, 0, 0))).toBe(60_000);
    expect(millisecondsToNextMinute(new Date(2026, 9, 7, 9, 5, 45, 500))).toBe(14_500);
  });
});
