import { describe, expect, it } from "vitest";
import { buildLinkRoutes, linkRoutePaths, slugify } from "./link-routes";
import { getProfile } from "./profile";

describe("slugify", () => {
  it("makes lowercase words joined by hyphens", () => {
    expect(slugify("GitHub")).toBe("github");
    expect(slugify("Twitter (X)")).toBe("twitter-x");
    expect(slugify("Professional Scrum Master certification")).toBe(
      "professional-scrum-master-certification",
    );
  });

  it("drops accents and turns symbols and runs of them into one hyphen", () => {
    expect(slugify("Café déjà vu")).toBe("cafe-deja-vu");
    expect(slugify("A -- B // C")).toBe("a-b-c");
  });

  it("never starts or ends with a hyphen", () => {
    expect(slugify("  --Kaggle!!  ")).toBe("kaggle");
  });

  it("falls back to a fixed word when nothing usable is left", () => {
    expect(slugify("")).toBe("link");
    expect(slugify("!!!")).toBe("link");
    expect(slugify("日本語")).toBe("link");
  });
});

const profile = {
  links: [
    { label: "GitHub", url: "https://github.com/someone", embed: false },
    { label: "Kaggle", url: "https://www.kaggle.com/someone" },
  ],
  certifications: [
    { name: "Course A", url: "https://example.org/a", embed: true },
    { name: "Course without a link" },
    { name: "Course B", url: "https://example.org/b" },
  ],
} as const;

describe("buildLinkRoutes", () => {
  it("lists the links first and then the certifications that have a link", () => {
    const routes = buildLinkRoutes(profile);

    expect(routes.map((route) => route.label)).toEqual([
      "GitHub",
      "Kaggle",
      "Course A",
      "Course B",
    ]);
  });

  it("gives each one a page address under /links/ and keeps its external address", () => {
    const [github] = buildLinkRoutes(profile);

    expect(github).toEqual({
      slug: "github",
      path: "/links/github/",
      url: "https://github.com/someone",
      label: "GitHub",
      embed: false,
    });
  });

  it("passes the embed flag through and leaves it undefined when not given", () => {
    const routes = buildLinkRoutes(profile);

    expect(routes.map((route) => route.embed)).toEqual([false, undefined, true, undefined]);
  });

  it("makes every slug and path unique, even for the same label", () => {
    const routes = buildLinkRoutes({
      links: [{ label: "Docs", url: "https://example.org/1" }],
      certifications: [
        { name: "Docs", url: "https://example.org/2" },
        { name: "docs!", url: "https://example.org/3" },
      ],
    });

    expect(routes.map((route) => route.slug)).toEqual(["docs", "docs-2", "docs-3"]);
    expect(new Set(routes.map((route) => route.path)).size).toBe(3);
  });

  it("does not let a suffix collide with a label that already looks like one", () => {
    const routes = buildLinkRoutes({
      links: [
        { label: "Docs 2", url: "https://example.org/1" },
        { label: "Docs", url: "https://example.org/2" },
        { label: "Docs", url: "https://example.org/3" },
      ],
      certifications: [{ name: "x", url: "https://example.org/4" }],
    });

    expect(routes.map((route) => route.slug)).toEqual(["docs-2", "docs", "docs-3", "x"]);
  });

  it("leaves out anything that is not an https link", () => {
    const routes = buildLinkRoutes({
      links: [
        { label: "Plain http", url: "http://example.org/" },
        { label: "Script", url: "javascript:alert(1)" },
        { label: "Broken", url: "not a url" },
        { label: "Fine", url: "https://example.org/" },
      ],
      certifications: [],
    });

    expect(routes.map((route) => route.label)).toEqual(["Fine"]);
  });

  it("is repeatable: the same content always gives the same routes", () => {
    expect(buildLinkRoutes(profile)).toEqual(buildLinkRoutes(profile));
  });

  it("returns nothing when there is nothing to link to", () => {
    expect(buildLinkRoutes({ links: [], certifications: [{ name: "No link" }] })).toEqual([]);
  });
});

describe("linkRoutePaths", () => {
  it("lists the page addresses in order", () => {
    expect(linkRoutePaths(buildLinkRoutes(profile))).toEqual([
      "/links/github/",
      "/links/kaggle/",
      "/links/course-a/",
      "/links/course-b/",
    ]);
  });
});

describe("the routes of the real CV file (content/cv.yml)", () => {
  const profile = getProfile();
  const routes = buildLinkRoutes(profile);

  it("has a page for every link and every certification that has a link", () => {
    const expected =
      profile.links.length +
      profile.certifications.filter((entry) => entry.url !== undefined).length;

    expect(routes).toHaveLength(expected);
    expect(expected).toBeGreaterThan(0);
  });

  it("has unique, well-formed page addresses", () => {
    const paths = linkRoutePaths(routes);

    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) expect(path).toMatch(/^\/links\/[a-z0-9]+(-[a-z0-9]+)*\/$/);
  });

  it("shows only https addresses that are in the content file", () => {
    const listed = new Set([
      ...profile.links.map((link) => link.url),
      ...profile.certifications.flatMap((entry) => (entry.url === undefined ? [] : [entry.url])),
    ]);

    for (const route of routes) {
      expect(route.url.startsWith("https://")).toBe(true);
      expect(listed.has(route.url)).toBe(true);
    }
  });
});
