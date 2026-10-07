/**
 * The element id a URL fragment points at. A malformed escape (`%E0%A4%A`) makes
 * `decodeURIComponent` throw, so the raw text is used then, as browsers do.
 */
export function fragmentId(hash: string): string {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
