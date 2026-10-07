import type { ProblemReporter } from "./problem-reporter";

const ID_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Reads an id: lowercase words joined by hyphens, unique among `seen`. */
export function readId(
  value: unknown,
  path: string,
  seen: Set<string>,
  reporter: ProblemReporter,
): string | undefined {
  if (typeof value !== "string" || !ID_SHAPE.test(value)) {
    reporter.report(path, "must be an id of lowercase letters, digits and hyphens");
    return undefined;
  }
  if (seen.has(value)) {
    reporter.report(path, `duplicate id "${value}"`);
    return undefined;
  }
  seen.add(value);
  return value;
}
