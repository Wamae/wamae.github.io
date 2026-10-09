import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getProfile } from "../../src/content/profile";
import { buildLinkRoutes, type LinkRoute } from "../../src/content/link-routes";
import { canEmbed } from "../../src/shell/link-kind";
import { buildSite, type BuiltSite } from "../support/build-site";

let site: BuiltSite;
const pages = new Map<string, string>();
const routes = buildLinkRoutes(getProfile());

beforeAll(async () => {
  site = await buildSite({
    PUBLIC_OWNER_NAME: "Integration Owner",
    PUBLIC_OWNER_EMAIL: "integration@example.invalid",
  });
  for (const route of routes) {
    pages.set(route.slug, await site.readFileText(`links/${route.slug}/index.html`));
  }
});

afterAll(async () => {
  await site?.remove();
});

const pageOf = (route: LinkRoute) => pages.get(route.slug) ?? "";
const unescape = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
const tags = (html: string, name: string) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map((match) => match[0]);
const attribute = (tag: string, name: string) =>
  unescape(new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] ?? "");
const framed = routes.filter((route) => canEmbed(route.url, route.embed));
const blocked = routes.filter((route) => !canEmbed(route.url, route.embed));

describe("the pages for external links (/links/<slug>/)", () => {
  it("exist for every external link in the content file", () => {
    expect(routes.length).toBeGreaterThan(0);
    expect(pages.size).toBe(routes.length);
  });

  it("have one h1 with the link's name, and the window's title", () => {
    for (const route of routes) {
      const html = pageOf(route);
      expect(html.match(/<h1\b/g)?.length, route.slug).toBe(1);
      expect(html, route.slug).toContain(`>${route.label}</h1>`);
      expect(html, route.slug).toContain(`<title>${route.label} - Integration Owner</title>`);
    }
  });

  it("show the real external address in the window's address bar", () => {
    for (const route of routes) {
      const input = tags(pageOf(route), "input").find((tag) =>
        tag.includes('id="browser-address"'),
      );
      expect(attribute(input ?? "", "value"), route.slug).toBe(route.url);
    }
  });

  it("open the external address in a new tab only from one button the visitor presses", () => {
    for (const route of routes) {
      const newTab = tags(pageOf(route), "a").filter((tag) => tag.includes('target="_blank"'));
      expect(newTab, route.slug).toHaveLength(1);
      expect(attribute(newTab[0] ?? "", "href"), route.slug).toBe(route.url);
      expect(attribute(newTab[0] ?? "", "rel"), route.slug).toBe("noopener noreferrer");
    }
  });

  it("have no other link to a page on another site", () => {
    for (const route of routes) {
      const external = tags(pageOf(route), "a")
        .map((tag) => attribute(tag, "href"))
        .filter((href) => /^https?:\/\//.test(href) && !href.startsWith("https://wamae.github.io"));
      expect(external, route.slug).toEqual([route.url]);
    }
  });
});

describe("a page that may be shown in a frame", () => {
  it("has exactly one frame, with the address, a title and a locked-down sandbox", () => {
    expect(framed.length).toBeGreaterThan(0);
    for (const route of framed) {
      const frames = tags(pageOf(route), "iframe");
      expect(frames, route.slug).toHaveLength(1);
      const frame = frames[0] ?? "";
      expect(attribute(frame, "src"), route.slug).toBe(route.url);
      expect(attribute(frame, "title"), route.slug).toContain(route.label);
      expect(attribute(frame, "referrerpolicy"), route.slug).toBe("no-referrer");
      expect(attribute(frame, "loading"), route.slug).toBe("lazy");
      expect(attribute(frame, "sandbox").split(" ").sort(), route.slug).toEqual([
        "allow-forms",
        "allow-same-origin",
        "allow-scripts",
      ]);
    }
  });

  it("warns that a blank frame means the site does not allow being shown", () => {
    for (const route of framed) {
      expect(pageOf(route), route.slug).toContain("stays blank");
    }
  });

  it("never lets the framed page open tabs or move the window", () => {
    for (const route of framed) {
      const sandbox = attribute(tags(pageOf(route), "iframe")[0] ?? "", "sandbox");
      expect(sandbox, route.slug).not.toContain("allow-popups");
      expect(sandbox, route.slug).not.toContain("allow-top-navigation");
      expect(sandbox, route.slug).not.toContain("allow-modals");
    }
  });
});

describe("a page for a site that refuses to be framed", () => {
  it("shows the notice and no frame at all", () => {
    expect(blocked.length).toBeGreaterThan(0);
    for (const route of blocked) {
      const html = pageOf(route);
      expect(html, route.slug).not.toContain("<iframe");
      expect(html, route.slug).toContain("This page cannot be displayed in this window");
      expect(html, route.slug).toContain("Open in a new tab");
    }
  });

  it("includes every site marked embed: false in the content file", () => {
    const marked = routes.filter((route) => route.embed === false);
    expect(marked.length).toBeGreaterThan(0);
    for (const route of marked) expect(pageOf(route), route.slug).not.toContain("<iframe");
  });
});

describe("the rest of the site", () => {
  it("has no page that opens in a new tab outside the link pages", async () => {
    for (const name of ["", "about/", "experience/", "projects/", "contact/"]) {
      const html = await site.readFileText(`${name}index.html`);
      expect(html.includes('target="_blank"'), name).toBe(false);
    }
  });
});
