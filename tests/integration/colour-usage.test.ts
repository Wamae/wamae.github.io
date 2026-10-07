import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { approvedColourPairs } from "../../src/design/approved-colour-pairs";
import { findUnapprovedColourUsage } from "../../src/design/find-unapproved-colour-usage";

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
    ),
  );
  return nested.flat();
}

/** The CSS of a source file: the whole file for .css, the style blocks for .astro. */
function styleOf(path: string, source: string): string {
  if (path.endsWith(".css")) return source;
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
}

describe("colour use in the real source", () => {
  it("uses only semantic tokens in approved pairs, and no colour literals", async () => {
    const sources = (await filesUnder(join(process.cwd(), "src"))).filter(
      (path) =>
        (path.endsWith(".css") || path.endsWith(".astro")) && !path.endsWith("styles/tokens.css"),
    );
    expect(sources.length).toBeGreaterThan(5);

    const violations: string[] = [];
    for (const path of sources) {
      const css = styleOf(path, await readFile(path, "utf8"));
      for (const violation of findUnapprovedColourUsage(css, approvedColourPairs)) {
        violations.push(`${path}: ${violation}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
