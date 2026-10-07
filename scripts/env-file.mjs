/**
 * Pure helpers for creating the local `.env` file. No file or terminal access here,
 * so they are easy to test. Validation of the values themselves stays in
 * `src/config/site-config.ts`, which the dev server and build already run.
 */

/** Returns an error message when the value cannot be written safely to a .env line, otherwise undefined. */
export function findUnsafeValue(label, value) {
  if (value.trim() === "") return `${label} must not be empty`;
  if (/[\r\n]/.test(value)) return `${label} must be on a single line`;
  if (value.includes('"')) return `${label} must not contain a double quote`;
  return undefined;
}

/** Renders the contents of a `.env` file for the two owner settings. Throws on an unsafe value. */
export function renderEnvFile({ name, email }) {
  const problem = findUnsafeValue("Name", name) ?? findUnsafeValue("Email", email);
  if (problem !== undefined) throw new Error(problem);
  return [
    "# Local settings. This file is gitignored. The values end up in the built site, so they are public.",
    `PUBLIC_OWNER_NAME="${name.trim()}"`,
    `PUBLIC_OWNER_EMAIL="${email.trim()}"`,
    "",
  ].join("\n");
}
