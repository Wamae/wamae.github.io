import { monthIndex, parsePartialDate, type PartialDate, type Period } from "./partial-date";
import { isRecord, type ProblemReporter } from "./problem-reporter";

function readDate(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): PartialDate | undefined {
  const date = typeof value === "string" ? parsePartialDate(value) : undefined;
  if (date === undefined) {
    reporter.report(path, 'must be a date such as "2012" or "2012-03" (year 1970 to 2100)');
  }
  return date;
}

/** Reads { start, end }. An `end` of null means ongoing. The end may not come before the start. */
export function readPeriod(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): Period | undefined {
  if (!isRecord(value)) {
    reporter.report(path, "must be an object with a start and an end");
    return undefined;
  }
  const start = readDate(value["start"], `${path}.start`, reporter);
  const end = value["end"] === null ? null : readDate(value["end"], `${path}.end`, reporter);
  if (start === undefined || end === undefined) return undefined;
  if (end !== null && monthIndex(end, "end") < monthIndex(start, "start")) {
    reporter.report(path, "ends before it starts");
    return undefined;
  }
  return { start, end };
}
