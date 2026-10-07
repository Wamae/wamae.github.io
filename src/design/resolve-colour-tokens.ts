const DECLARATION = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
const VAR_REFERENCE = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i;

/** Reads every custom property declared in the given CSS text, as written. */
export function readCustomProperties(css: string): Map<string, string> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const properties = new Map<string, string>();
  for (const match of withoutComments.matchAll(DECLARATION)) {
    properties.set(match[1] as string, (match[2] as string).trim());
  }
  return properties;
}

/** Follows `var(--other)` references until a literal value (a hex colour) is reached. */
export function resolveCustomProperty(
  properties: ReadonlyMap<string, string>,
  name: string,
): string {
  const seen = new Set<string>();
  let current = name;
  for (;;) {
    if (seen.has(current)) throw new Error(`Circular custom property reference at ${current}`);
    seen.add(current);
    const value = properties.get(current);
    if (value === undefined) throw new Error(`Custom property ${current} is not defined`);
    const reference = VAR_REFERENCE.exec(value);
    if (reference === null) return value;
    current = reference[1] as string;
  }
}
