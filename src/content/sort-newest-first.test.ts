import { describe, expect, it } from "vitest";
import type { PartialDate, Period } from "./partial-date";
import { sortNewestFirst } from "./sort-newest-first";

const date = (text: string): PartialDate => {
  const [year, month] = text.split("-");
  return month === undefined
    ? { year: Number(year) }
    : { year: Number(year), month: Number(month) };
};

const entry = (id: string, start: string, end: string | null): { id: string; period: Period } => ({
  id,
  period: { start: date(start), end: end === null ? null : date(end) },
});

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);

describe("sortNewestFirst", () => {
  it("puts the entry that ended last first", () => {
    const result = sortNewestFirst([entry("old", "2010", "2011"), entry("new", "2012", "2013")]);
    expect(ids(result)).toEqual(["new", "old"]);
  });

  it("treats an ongoing entry as newest, even against one that ended in the future", () => {
    const result = sortNewestFirst([
      entry("ended", "2020-01", "2099-12"),
      entry("ongoing", "2015-01", null),
    ]);
    expect(ids(result)).toEqual(["ongoing", "ended"]);
  });

  it("puts the later start first when the end dates are the same", () => {
    const result = sortNewestFirst([
      entry("started-early", "2018-05", "2021-09"),
      entry("started-late", "2019-01", "2021-09"),
    ]);
    expect(ids(result)).toEqual(["started-late", "started-early"]);
  });

  it("keeps both overlapping entries, ordered by end date", () => {
    const result = sortNewestFirst([
      entry("a", "2021-12", "2023-01"),
      entry("b", "2021-12", "2022-12"),
      entry("c", "2018-12", "2021-12"),
    ]);
    expect(ids(result)).toEqual(["a", "b", "c"]);
  });

  it("orders several ongoing entries by start date", () => {
    const result = sortNewestFirst([entry("x", "2019", null), entry("y", "2022", null)]);
    expect(ids(result)).toEqual(["y", "x"]);
  });

  it("keeps the data-file order when the periods are identical", () => {
    const first = [entry("b", "2020", "2021"), entry("a", "2020", "2021")];
    const second = [first[1], first[0]] as typeof first;
    expect(ids(sortNewestFirst(first))).toEqual(["b", "a"]);
    expect(ids(sortNewestFirst(second))).toEqual(["a", "b"]);
  });

  it("keeps the data-file order for ties among a longer list", () => {
    const result = sortNewestFirst([
      entry("t3", "2020", "2021"),
      entry("newer", "2022", "2023"),
      entry("t1", "2020", "2021"),
      entry("t2", "2020", "2021"),
    ]);
    expect(ids(result)).toEqual(["newer", "t3", "t1", "t2"]);
  });

  it("counts a year-only end as the end of that year", () => {
    const result = sortNewestFirst([
      entry("march", "2013", "2014-03"),
      entry("year", "2012", "2014"),
    ]);
    expect(ids(result)).toEqual(["year", "march"]);
  });

  it("counts a year-only start as the start of that year", () => {
    const result = sortNewestFirst([
      entry("february", "2014-02", "2015-06"),
      entry("year", "2014", "2015-06"),
    ]);
    expect(ids(result)).toEqual(["february", "year"]);
  });

  it("does not change the list it is given", () => {
    const input = [entry("old", "2010", "2011"), entry("new", "2012", "2013")];
    sortNewestFirst(input);
    expect(ids(input)).toEqual(["old", "new"]);
  });

  it("returns an empty list for an empty list", () => {
    expect(sortNewestFirst([])).toEqual([]);
  });
});
