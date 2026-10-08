import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { approvedColourPairs } from "../../src/design/approved-colour-pairs";
import {
  findColourLiteralsInScript,
  findTokensReadByScript,
} from "../../src/design/find-colour-in-script";
import {
  findUnapprovedColourUsage,
  findUnapprovedStyleAttributes,
} from "../../src/design/find-unapproved-colour-usage";

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

  it("has no colour in style attributes of .astro or .ts files", async () => {
    const sources = (await filesUnder(join(process.cwd(), "src"))).filter(
      (path) => (path.endsWith(".astro") || path.endsWith(".ts")) && !path.endsWith(".test.ts"),
    );
    const violations: string[] = [];
    for (const path of sources) {
      for (const violation of findUnapprovedStyleAttributes(
        await readFile(path, "utf8"),
        approvedColourPairs,
      )) {
        violations.push(`${path}: ${violation}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("has no colour literal in any TypeScript source: scripts read tokens at run time", async () => {
    const sources = (await filesUnder(join(process.cwd(), "src"))).filter(
      // The design folder holds the palette itself, the one place with colour values.
      (path) => path.endsWith(".ts") && !path.endsWith(".test.ts") && !path.includes("/design/"),
    );
    expect(sources.length).toBeGreaterThan(5);
    const violations: string[] = [];
    for (const path of sources) {
      for (const found of findColourLiteralsInScript(await readFile(path, "utf8"))) {
        violations.push(`${path}: ${found}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("uses every semantic token and every approved pair token somewhere in the source", async () => {
    const files = await filesUnder(join(process.cwd(), "src"));
    const tokensCss = await readFile(join(process.cwd(), "src/styles/tokens.css"), "utf8");
    let used = "";
    for (const path of files) {
      if (/\.(css|astro)$/.test(path) && !path.endsWith("styles/tokens.css")) {
        used += await readFile(path, "utf8");
      }
    }
    // Tokens that other tokens are built from count as used through them.
    const declared = [...tokensCss.matchAll(/(--(?!vga-)[a-z0-9-]+)\s*:/g)].map(
      (m) => m[1] as string,
    );
    // A token the script reads with getPropertyValue("--name") counts as used. A name in a comment,
    // or in any other string, does not.
    const read = new Set<string>();
    for (const path of files) {
      if (path.endsWith(".ts") && !path.endsWith(".test.ts")) {
        for (const name of findTokensReadByScript(await readFile(path, "utf8"))) read.add(name);
      }
    }
    const unused = declared.filter(
      (name) =>
        !used.includes(`var(${name}`) && !tokensCss.includes(`var(${name})`) && !read.has(name),
    );
    expect(unused).toEqual([]);

    for (const pair of approvedColourPairs) {
      expect(used, pair.id).toContain(`var(${pair.foregroundToken})`);
    }
  });
});
