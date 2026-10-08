import { YAMLException, load } from "js-yaml";
import { buildLineIndex, type LineOf } from "./yaml-line-index";

export interface ParsedYaml {
  readonly data: unknown;
  /** The line where a path such as `roles[3].end` is written, when known. */
  readonly lineOf: LineOf;
}

/**
 * Reads YAML text with js-yaml's safe core schema: plain data only, no code or custom object
 * tags (a tag such as `!!js/function` is an error), duplicate keys are an error, and aliases
 * (`*name`) are rejected, so a file can only hold what it visibly says.
 * A syntax error throws one error that carries the parser's line, column and a snippet.
 */
export function parseYamlSource(source: string, filename: string): ParsedYaml {
  try {
    const data: unknown = load(source, { filename, maxAliases: 0 });
    return { data, lineOf: buildLineIndex(source) };
  } catch (error) {
    if (error instanceof YAMLException) {
      throw new Error(`${filename} is not valid YAML: ${error.message}`, { cause: error });
    }
    throw error;
  }
}
