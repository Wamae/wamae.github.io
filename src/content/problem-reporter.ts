import { findCurrency } from "./currency-rule";

/** Collects every problem found, each with the path of the field it is about. */
export interface ProblemReporter {
  readonly problems: readonly string[];
  report(path: string, message: string): void;
}

export function createProblemReporter(): ProblemReporter {
  const problems: string[] = [];
  return {
    problems,
    report: (path, message) => {
      problems.push(`${path}: ${message}`);
    },
  };
}

export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads a required text field. Rejects empty text and any currency. */
export function readText(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    reporter.report(path, "must be a non-empty text");
    return undefined;
  }
  const currency = findCurrency(value);
  if (currency !== undefined) {
    reporter.report(
      path,
      `contains the currency "${currency}"; show results as percentages only, never as currency`,
    );
    return undefined;
  }
  return value.trim();
}

/** Reads a text field that may be left out. If it is there it must be valid. */
export function readOptionalText(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
): string | undefined {
  return value === undefined ? undefined : readText(value, path, reporter);
}

/** Reads a list of texts. An empty list is allowed only when `allowEmpty` is set. */
export function readTextList(
  value: unknown,
  path: string,
  reporter: ProblemReporter,
  allowEmpty: boolean,
): string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    reporter.report(path, allowEmpty ? "must be a list" : "must be a non-empty list");
    return [];
  }
  const texts: string[] = [];
  value.forEach((item: unknown, index) => {
    const text = readText(item, `${path}[${index}]`, reporter);
    if (text !== undefined) texts.push(text);
  });
  return texts;
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
