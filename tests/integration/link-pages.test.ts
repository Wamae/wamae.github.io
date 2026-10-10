import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getProfile } from "../../src/content/profile";
import { buildLinkRoutes, type LinkRoute } from "../../src/content/link-routes";
import { canEmbed } from "../../src/shell/link-kind";
import { buildSite, type BuiltSite } from "../support/build-site";
import { buildSiteWithEditedCv, type CopyBuild } from "../support/build-site-copy";

const env = {
  PUBLIC_OWNER_NAME: "Integration Owner",
  PUBLIC_OWNER_EMAIL: "integration@example.invalid",
};

let site: BuiltSite;
let fixture: CopyBuild;
const pages = new Map<string, string>();
const allRoutes = buildLinkRoutes(getProfile());
// Only a link whose site can be shown in the window has a page; the others open in a new tab.
const routes = allRoutes.filter((route) => canEmbed(route.url, route.embed));
const noPageRoutes = allRoutes.filter((route) => !canEmbed(route.url, route.embed));

/** The links of the fixture: one the window may frame and one that refuses to be framed. */
const fixtureLinks = `
links:
  - label: Framed Sample
    url: https://framed.example.test/page?a=1&b=2
  - label: Blocked Sample
    url: https://blocked.example.test/page
    embed: false
`;

beforeAll(async () => {
  site = await buildSite(env);
  for (const route of routes) {
    pages.set(route.slug, await site.readFileText(`links/${route.slug}/index.html`));
  }
  fixture = await buildSiteWithEditedCv(env, (cv) =>
    cv.replace(/\nlinks:\n[\s\S]*$/, fixtureLinks),
  );
});

afterAll(async () => {
  await site?.remove();
  await fixture?.remove();
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
const newTabLinks = (html: string) =>
  tags(html, "a").filter((tag) => tag.includes('target="_blank"'));
const otherSites = (html: string) =>
  tags(html, "a")
    .map((tag) => attribute(tag, "href"))
    .filter(
      (href) => /^[a-z][a-z0-9+.-]*:/i.test(href) && !/^https:\/\/wamae\.github\.io/i.test(href),
    );

describe("the pages for the real external links (/links/<slug>/)", () => {
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
      const newTab = newTabLinks(pageOf(route));
      expect(newTab, route.slug).toHaveLength(1);
      expect(attribute(newTab[0] ?? "", "href"), route.slug).toBe(route.url);
      expect(attribute(newTab[0] ?? "", "rel"), route.slug).toBe("noopener noreferrer");
    }
  });

  it("have no other link to another site", () => {
    for (const route of routes) expect(otherSites(pageOf(route)), route.slug).toEqual([route.url]);
  });

  it("show the page in a frame", () => {
    for (const route of routes) {
      const frames = tags(pageOf(route), "iframe");
      expect(frames, route.slug).toHaveLength(1);
      expect(attribute(frames[0] ?? "", "src"), route.slug).toBe(route.url);
    }
  });

  it("are built for exactly the links whose site can be shown, and for no other", async () => {
    const built = (await site.listFiles("links")).sort();
    expect(built).toEqual(routes.map((route) => route.slug).sort());
    for (const route of noPageRoutes) expect(built, route.slug).not.toContain(route.slug);
  });

  it("are the pages the script is told about, in the same order", async () => {
    const home = await site.readFileText("index.html");
    const listed = (/ data-link-routes="([^"]*)"/.exec(home)?.[1] ?? "").split(" ").filter(Boolean);
    expect(listed).toEqual(routes.map((route) => route.path));
  });
});

describe("a link page for a site that may be framed (fixture content)", () => {
  let html = "";
  beforeAll(async () => {
    expect(fixture.ok, fixture.stderr).toBe(true);
    html = await fixture.readFileText("links/framed-sample/index.html");
  });

  it("has exactly one frame, with the address, a title and a locked-down sandbox", () => {
    const frames = tags(html, "iframe");
    expect(frames).toHaveLength(1);
    const frame = frames[0] ?? "";
    expect(attribute(frame, "src")).toBe("https://framed.example.test/page?a=1&b=2");
    expect(attribute(frame, "title")).toContain("Framed Sample");
    expect(attribute(frame, "referrerpolicy")).toBe("no-referrer");
    expect(attribute(frame, "loading")).toBe("lazy");
    expect(attribute(frame, "allow")).toBe("");
    expect(attribute(frame, "sandbox").split(" ").sort()).toEqual([
      "allow-forms",
      "allow-same-origin",
      "allow-scripts",
    ]);
  });

  it("never lets the framed page open tabs, dialogs or move the window", () => {
    const sandbox = attribute(tags(html, "iframe")[0] ?? "", "sandbox");
    for (const right of ["popups", "top-navigation", "modals", "downloads", "pointer-lock"]) {
      expect(sandbox).not.toContain(right);
    }
  });

  it("warns that a blank frame, or an address bar that does not change, is the site's doing", () => {
    expect(html).toContain("stays blank or shows an error");
    expect(html).toContain("does not change");
    expect(html).toContain("open the page in a new tab");
  });

  it("opens a new tab only from the visitor's button, to the same address", () => {
    const newTab = newTabLinks(html);
    expect(newTab).toHaveLength(1);
    expect(attribute(newTab[0] ?? "", "href")).toBe("https://framed.example.test/page?a=1&b=2");
    expect(attribute(newTab[0] ?? "", "rel")).toBe("noopener noreferrer");
  });
});

describe("a link whose site refuses to be framed (fixture content)", () => {
  it("gets no page, and is not listed for the script", async () => {
    expect(fixture.ok, fixture.stderr).toBe(true);
    await expect(fixture.readFileText("links/blocked-sample/index.html")).rejects.toThrow();
    const home = await fixture.readFileText("index.html");
    const listed = (/ data-link-routes="([^"]*)"/.exec(home)?.[1] ?? "").split(" ").filter(Boolean);
    expect(listed).toContain("/links/framed-sample/");
    expect(listed.some((path) => path.includes("blocked"))).toBe(false);
  });
});

describe("the rest of the site", () => {
  // About and Contact have links to other sites that open a new tab (checked in content-pages.test.ts).
  // No other page may open a new tab.
  it("has no link that opens a new tab on the other pages", async () => {
    const names = [
      "index.html",
      "404.html",
      "experience/index.html",
      "projects/index.html",
      "program-manager/index.html",
      "file-manager/index.html",
    ];
    for (const name of names) {
      const html = await site.readFileText(name).catch(() => "");
      expect(html.includes('target="_blank"'), name).toBe(false);
    }
  });
});
