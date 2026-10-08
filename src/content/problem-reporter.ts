import { findCurrency } from "./currency-rule";
import { parseEmphasis } from "./emphasis";
import type { RichText } from "./profile-types";
import type { LineOf } from "./yaml-line-index";

/** Collects every problem found, each with the path of the field it is about and its line. */
export interface ProblemReporter {
  readonly problems: readonly string[];
  report(path: string, message: string): void;
}

/** The nearest line for a path: the path itself, or the closest parent that has one. */
function nearestLine(path: string, lineOf: LineOf): number | undefined {
  let current = path;
  while (current !== "") {
    const line = lineOf(current);
    if (line !== undefined) return line;
    const parent = current.replace(/(?:\.[^.[\]]+|\[\d+\])$/, "");
    current = parent === current ? "" : parent;
  }
  return undefined;
}

export function createProblemReporter(lineOf: LineOf = () => undefined): ProblemReporter {
  const problems: string[] = [];
  return {
    problems,
    report: (path, message) => {
      const line = nearestLine(path, lineOf);
      problems.push(`${path}: ${message}${line === undefined ? "" : ` (line ${line})`}`);
    },
  };
}

export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withoutBlank(value: unknown, path: string, reporter: ProblemReporter): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    reporter.report(path, "must be a non-empty text");
    return undefined;
  }
  return value.trim();
}

function reportCurrency(text: string, path: string, reporter: ProblemReporter): boolean {
  const currency = findCurrency(text);
  if (currency === undefined) return false;
  reporter.report(
    path,
    `contains the currency "${currency}"; show results as percentages only, never as currency`,
  );
  return true;
}

/** Reads a required plain text field. Rejects empty text, asterisks and any currency. */
export function readText(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): string | undefined {
  const text = withoutBlank(value, path, reporter);
  if (text === undefined) return undefined;
  if (text.includes("*")) {
    reporter.report(
      path,
      "may not contain asterisks: bold works only in the summary, description, highlights and results",
    );
    return undefined;
  }
  return reportCurrency(text, path, reporter) ? undefined : text;
}

/** Reads a required text that may hold **bold** figures. The currency rule runs without markers. */
export function readRichText(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): RichText | undefined {
  const text = withoutBlank(value, path, reporter);
  if (text === undefined) return undefined;
  const parsed = parseEmphasis(text);
  if (!parsed.ok) {
    reporter.report(path, parsed.error);
    return undefined;
  }
  const plain = parsed.segments.map((segment) => segment.text).join("");
  return reportCurrency(plain, path, reporter) ? undefined : { segments: parsed.segments, plain };
}

/** Reads a plain text field that may be left out. If it is there it must be valid. */
export function readOptionalText(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): string | undefined {
  return value === undefined ? undefined : readText(value, path, reporter);
}

/** Reads a rich text field that may be left out. If it is there it must be valid. */
export function readOptionalRichText(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): RichText | undefined {
  return value === undefined ? undefined : readRichText(value, path, reporter);
}

/** Reads a list with `readItem` for each entry. An empty list is allowed only with `allowEmpty`. */
function readList<T>(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
  allowEmpty: boolean,
  readItem: (item: unknown, itemPath: string, reporter: ProblemReporter) => T | undefined,
): T[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    reporter.report(path, allowEmpty ? "must be a list" : "must be a non-empty list");
    return [];
  }
  const items: T[] = [];
  value.forEach((item: unknown, index) => {
    const read = readItem(item, `${path}[${index}]`, reporter);
    if (read !== undefined) items.push(read);
  });
  return items;
}

export function readTextList(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
  allowEmpty: boolean,
): string[] {
  return readList(value, path, reporter, allowEmpty, readText);
}

export function readRichTextList(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
  allowEmpty: boolean,
): RichText[] {
  return readList(value, path, reporter, allowEmpty, readRichText);
}

/** Reads an https link. Links are not checked for currency. */
export function readHttpsUrl(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): string | undefined {
  if (typeof value === "string" && URL.canParse(value) && new URL(value).protocol === "https:") {
    return value;
  }
  reporter.report(path, "must be a valid https link");
  return undefined;
}

/** Reads a list of records, reporting an error when the value is not a list. */
export function readRecords(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): readonly Readonly<Record<string, unknown>>[] {
  if (!Array.isArray(value) || value.length === 0) {
    reporter.report(path, "must be a non-empty list");
    return [];
  }
  return value.map((item: unknown, index) => {
    if (isRecord(item)) return item;
    reporter.report(`${path}[${index}]`, "must be an object");
    return {};
  });
}

/** Reports every field that is not in `allowed`, which catches typos such as "highlight". */
export function rejectUnknownFields(
  fields: Readonly<Record<string, unknown>>,
  allowed: readonly string[],
  path: string,
  reporter: ProblemReporter,
): void {
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) continue;
    const where = path === "" ? key : `${path}.${key}`;
    reporter.report(where, `unknown field (allowed: ${allowed.join(", ")})`);
  }
}
