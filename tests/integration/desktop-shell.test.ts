import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildSite, type BuiltSite } from "../support/build-site";

let site: BuiltSite;

beforeAll(async () => {
  site = await buildSite({
    PUBLIC_OWNER_NAME: "Integration Owner",
    PUBLIC_OWNER_EMAIL: "integration@example.invalid",
  });
});

afterAll(async () => {
  await site?.remove();
});

const tagsWithClass = (html: string, className: string) =>
  [...html.matchAll(/<(\w+)([^>]*)>/g)].filter(([, , attributes]) =>
    new RegExp(`class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"`).test(attributes as string),
  );

const textOf = (fragment: string) =>
  fragment
    .replace(/<span[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

describe("desktop shell markup", () => {
  it("has exactly one h1, with the owner name", () => {
    expect(site.html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(site.html).toMatch(/<h1[^>]*>Integration Owner<\/h1>/);
  });

  it("never skips a heading level on the way down", () => {
    const levels = [...site.html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    expect(levels[0]).toBe(1);
    levels.forEach((level, index) => {
      if (index > 0) expect(level - (levels[index - 1] as number)).toBeLessThanOrEqual(1);
    });
  });

  it("has banner, main and contentinfo landmarks", () => {
    expect(site.html).toMatch(/<header[\s>]/);
    expect(site.html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(site.html).toMatch(/<footer[\s>]/);
  });

  it.each([
    ["program-manager", "Program Manager"],
    ["file-manager", "File Manager"],
  ])("has a named region for %s", (id, title) => {
    expect(site.html).toMatch(
      new RegExp(`<section[^>]*id="${id}"[^>]*aria-labelledby="${id}-title"`),
    );
    expect(site.html).toMatch(new RegExp(`<h2[^>]*id="${id}-title"[^>]*>${title}</h2>`));
  });

  it("makes every program icon a real link with an accessible name", () => {
    const icons = [
      ...site.html.matchAll(
        /<a\b([^>]*\bclass="[^"]*\bprogram-icon\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/g,
      ),
    ];
    expect(icons.length).toBeGreaterThanOrEqual(5);
    for (const [, attributes, inner] of icons) {
      expect(attributes).toMatch(/href="#[a-z-]+"/);
      expect(textOf(inner as string).length).toBeGreaterThan(0);
    }
  });

  it("points every in-page link at an element that exists", () => {
    const ids = new Set([...site.html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    const targets = [...site.html.matchAll(/\bhref="#([^"]+)"/g)].map((m) => m[1]);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) expect(ids.has(target), `#${target}`).toBe(true);
  });

  it("hides decorative chrome from assistive technology", () => {
    for (const className of ["control-box", "controls", "menu-bar", "icon"]) {
      const tags = tagsWithClass(site.html, className);
      expect(tags.length, className).toBeGreaterThan(0);
      for (const [tag] of tags) expect(tag, className).toContain('aria-hidden="true"');
    }
  });

  it("has both skip links", () => {
    expect(site.html).toMatch(/href="#main"[^>]*>Skip to main content</);
    expect(site.html).toMatch(/href="#plain-content"[^>]*>Skip the desktop to plain content</);
    expect(site.html).toContain('id="plain-content"');
  });

  it("needs no JavaScript: no script tags and no handlers", () => {
    expect(site.html).not.toMatch(/<script[\s>]/i);
    expect(site.html).not.toMatch(/\son[a-z]+="/i);
    expect(site.html).toContain("Experience: content arrives in a later milestone.");
  });

  it("serves the licence files for the self-hosted assets", async () => {
    expect(await site.listFiles("licenses")).toEqual(
      expect.arrayContaining(["pixelify-sans-OFL.txt", "pixelarticons-MIT.txt"]),
    );
  });
});
