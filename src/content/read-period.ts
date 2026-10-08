import { monthIndex, parsePartialDate, type PartialDate, type Period } from "./partial-date";
import type { ProblemReporter } from "./problem-reporter";

type Fields = Readonly<Record<string, unknown>>;

/** A bare year in YAML (2012) is read as a number, so a whole number counts as a year. */
function readDate(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): PartialDate | undefined {
  const text = typeof value === "number" && Number.isInteger(value) ? String(value) : value;
  const date = typeof text === "string" ? parsePartialDate(text) : undefined;
  if (date === undefined) {
    reporter.report(
      path,
      "must be a date such as 2012 or 2012-03 (year 1970 to 2100), or null for an end that is still going",
    );
  }
  return date;
}

/**
 * Reads `start` and `end` from a role or project. An `end` of null means ongoing, and it must be
 * written. The end may not come before the start.
 */
export function readPeriod(
  fields: Fields,
  path: string,
  reporter: ProblemReporter,
): Period | undefined {
  const start = readDate(fields["start"], `${path}.start`, reporter);
  const end = fields["end"] === null ? null : readDate(fields["end"], `${path}.end`, reporter);
  if (start === undefined || end === undefined) return undefined;
  if (end !== null && monthIndex(end, "end") < monthIndex(start, "start")) {
    reporter.report(`${path}.end`, "ends before it starts");
    return undefined;
  }
  return { start, end };
}

/** True when the entry gives any date of its own. */
export function hasOwnDates(fields: Fields): boolean {
  return fields["start"] !== undefined || "end" in fields;
}
