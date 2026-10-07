import { describe, expect, it } from "vitest";
import { formatPartialDate, monthIndex, parsePartialDate, toIsoDate } from "./partial-date";

describe("parsePartialDate", () => {
  it("reads a year on its own", () => {
    expect(parsePartialDate("2012")).toEqual({ year: 2012 });
  });

  it("reads a year and a month", () => {
    expect(parsePartialDate("2012-03")).toEqual({ year: 2012, month: 3 });
  });

  it.each(["", "12", "2012-13", "2012-00", "2012-3", "2012-03-01", "March 2012", " 2012", "1969"])(
    "rejects %j",
    (text) => {
      expect(parsePartialDate(text)).toBeUndefined();
    },
  );

  it("rejects a year after 2100", () => {
    expect(parsePartialDate("2101")).toBeUndefined();
  });
});

describe("formatting", () => {
  it("shows a year-only date as the year", () => {
    expect(formatPartialDate({ year: 2012 })).toBe("2012");
    expect(toIsoDate({ year: 2012 })).toBe("2012");
  });

  it("shows a month with its name and an ISO form with two digits", () => {
    expect(formatPartialDate({ year: 2024, month: 3 })).toBe("March 2024");
    expect(toIsoDate({ year: 2024, month: 3 })).toBe("2024-03");
    expect(formatPartialDate({ year: 2024, month: 12 })).toBe("December 2024");
  });
});

describe("monthIndex", () => {
  it("puts a year-only start in January and a year-only end in December", () => {
    expect(monthIndex({ year: 2014 }, "start")).toBe(monthIndex({ year: 2014, month: 1 }, "start"));
    expect(monthIndex({ year: 2014 }, "end")).toBe(monthIndex({ year: 2014, month: 12 }, "end"));
  });
});
