/** A date as the CV gives it: a year, or a year and a month (1 to 12). */
export interface PartialDate {
  readonly year: number;
  readonly month?: number;
}

/** A span of time. An `end` of null means the role is ongoing. */
export interface Period {
  readonly start: PartialDate;
  readonly end: PartialDate | null;
}

const DATE_SHAPE = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/;
const FIRST_YEAR = 1970;
const LAST_YEAR = 2100;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Reads "2012" or "2012-03". Returns undefined for anything else. */
export function parsePartialDate(text: string): PartialDate | undefined {
  const match = DATE_SHAPE.exec(text);
  if (match === null) return undefined;
  const year = Number(match[1]);
  if (year < FIRST_YEAR || year > LAST_YEAR) return undefined;
  return match[2] === undefined ? { year } : { year, month: Number(match[2]) };
}

/** The machine-readable form for a `time` element's `datetime`: "2012" or "2012-03". */
export function toIsoDate(date: PartialDate): string {
  if (date.month === undefined) return String(date.year);
  return `${date.year}-${String(date.month).padStart(2, "0")}`;
}

/** The words shown to a visitor: "2012" or "March 2012". */
export function formatPartialDate(date: PartialDate): string {
  if (date.month === undefined) return String(date.year);
  return `${MONTH_NAMES[date.month - 1]} ${date.year}`;
}

/**
 * A number to compare dates by. A year-only date stands for the whole year, so its start is
 * January and its end is December. That is the rule the sort relies on.
 */
export function monthIndex(date: PartialDate, edge: "start" | "end"): number {
  const fallbackMonth = edge === "start" ? 1 : 12;
  return date.year * 12 + ((date.month ?? fallbackMonth) - 1);
}
