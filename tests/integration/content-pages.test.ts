import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findCurrency } from "../../src/content/currency-rule";
import { industries } from "../../src/content/industries";
import { buildLinkRoutes, linkTarget } from "../../src/content/link-routes";
import { getProfile } from "../../src/content/profile";
import { buildSite, type BuiltSite } from "../support/build-site";

let site: BuiltSite;
const pages: Record<string, string> = {};
const profile = getProfile();
const linkRoutes = buildLinkRoutes(profile);
/** The attributes of the link whose text is exactly `text`, or an empty string when there is none. */
const anchorAttributes = (html: string, text: string) =>
  new RegExp(`<a\\b([^>]*)>\\s*${escapeRegExp(text)}\\s*</a>`).exec(html)?.[1] ?? "";
const attributeOf = (attributes: string, name: string) =>
  new RegExp(`\\s${name}="([^"]*)"`).exec(` ${attributes}`)?.[1];
/** An outside address may only be a link that opens a new tab, safely. */
const outsideLinksOpenSafely = (html: string) => {
  for (const match of html.matchAll(/<a\b([^>]*)>/g)) {
    const attributes = match[1] ?? "";
    if (!/^https?:/i.test(attributeOf(attributes, "href") ?? "")) continue;
    expect(attributeOf(attributes, "target"), attributes).toBe("_blank");
    expect(attributeOf(attributes, "rel"), attributes).toBe("noopener noreferrer");
  }
};
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const contentPaths = ["about", "experience", "projects", "contact"] as const;

beforeAll(async () => {
  site = await buildSite({
    PUBLIC_OWNER_NAME: "Integration Owner",
    PUBLIC_OWNER_EMAIL: "integration@example.invalid",
  });
  for (const path of contentPaths) pages[path] = await site.readFileText(`${path}/index.html`);
});

afterAll(async () => {
  await site?.remove();
});

const mainOf = (path: string) => /<main[\s\S]*?<\/main>/.exec(pages[path] as string)?.[0] ?? "";
const textOf = (html: string) =>
  html
    .replace(/<\/?strong[^>]*>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
/** Removes the spaces that tag removal leaves before a comma or a closing bracket. */
const tight = (text: string) => text.replace(/\s+([,)])/g, "$1");
const headings = (html: string, level: number) =>
  [...html.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, "g"))].map((m) =>
    textOf(m[1] as string),
  );

describe("the real data file", () => {
  it("passes validation and gives every project exactly one known industry", () => {
    expect(profile.projects.length).toBeGreaterThan(0);
    for (const project of profile.projects) expect(industries).toContain(project.industry);
  });
});

describe("/experience/", () => {
  it("lists every role, newest first, straight from the data file", () => {
    const html = mainOf("experience");
    expect(headings(html, 2)).toEqual(profile.roles.map((role) => role.title));
    const ids = [...html.matchAll(/<li id="role-([a-z0-9-]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(profile.roles.map((role) => role.id));
  });

  it("puts the latest role first and the earliest last", () => {
    const titles = headings(mainOf("experience"), 2);
    expect(titles[0]).toBe("Technical Project Manager");
    expect(titles.at(-1)).toBe("Java Web and Android Developer");
    expect(titles).toHaveLength(9);
  });

  it("shows overlapping roles together", () => {
    const text = textOf(mainOf("experience"));
    for (const employer of ["Andela", "Indeed Flex", "Droid Pwani", "Azenia (Equity Bank)"]) {
      expect(text).toContain(employer);
    }
  });

  it("writes dates in machine-readable time elements, month or year", () => {
    const html = mainOf("experience");
    expect(html).toContain('<time datetime="2024-03">March 2024</time>');
    expect(html).toContain('<time datetime="2012-05">May 2012</time>');
    expect(textOf(html)).toContain("March 2024 to August 2026");
    expect(textOf(html)).toContain("March 2012 to May 2012");
  });

  it("links each role's projects to the projects page", () => {
    expect(mainOf("experience")).toContain('href="/projects/#project-move-money"');
  });
});

describe("/projects/", () => {
  const html = () => mainOf("projects");
  const articles = () =>
    [...html().matchAll(/<article aria-labelledby="project-[\s\S]*?<\/article>/g)].map((m) => m[0]);

  it("lists every project newest first with its single industry, role and period", () => {
    expect(articles()).toHaveLength(profile.projects.length);
    const ids = [...html().matchAll(/<li id="project-([a-z0-9-]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(profile.projects.map((project) => project.id));
    articles().forEach((article, index) => {
      const project = profile.projects[index];
      expect(article.match(/Industry:/g), project?.id).toHaveLength(1);
      expect(textOf(article)).toContain(`Industry: ${project?.industry}`);
      expect(article).toContain("<time datetime=");
      const role = profile.roles.find((candidate) => candidate.id === project?.roleId);
      expect(tight(textOf(article))).toContain(`Role: ${role?.employer} (${role?.title}, `);
    });
  });

  it("labels the period as the role's, not the project's own", () => {
    const text = tight(textOf(html()));
    expect(text).toContain(
      "Role: Kopo Kopo (Technical Project Manager, March 2024 to August 2026)",
    );
    expect(text).not.toContain("Project period:");
  });

  it("lists only industries that have projects, and no empty one", () => {
    const summary = /<ul class="industries[\s\S]*?<\/ul>/.exec(html())?.[0] ?? "";
    const listed = [...summary.matchAll(/<a href="#industry-[a-z-]+"[^>]*>([^<]+)<\/a>/g)].map(
      (m) => m[1],
    );
    const used = new Set(profile.projects.map((project) => project.industry));
    expect(listed).toEqual(industries.filter((industry) => used.has(industry)));
    expect(listed).not.toContain("Agriculture");
    expect(summary).not.toContain("(0)");
  });

  it("shows a summary of counts per industry that adds up to all projects", () => {
    const summary = /<ul class="industries[\s\S]*?<\/ul>/.exec(html())?.[0] ?? "";
    const counts = [
      ...summary.matchAll(/<a href="#industry-([a-z-]+)"[^>]*>([^<]+)<\/a>\s*\((\d+)\)/g),
    ];
    expect(counts.reduce((sum, m) => sum + Number(m[3]), 0)).toBe(profile.projects.length);
    for (const match of counts) {
      expect(html()).toContain(`id="industry-${match[1]}"`);
    }
  });
});

describe("/about/", () => {
  it("shows the summary, every skill, the education and the certifications", () => {
    const text = textOf(mainOf("about"));
    for (const paragraph of profile.summary) expect(text).toContain(paragraph.plain);
    for (const skill of profile.keySkills) expect(text).toContain(skill);
    for (const entry of profile.education) expect(text).toContain(entry.qualification);
    for (const certification of profile.certifications) expect(text).toContain(certification.name);
    expect(headings(mainOf("about"), 2)).toEqual(["Key skills", "Education", "Certifications"]);
  });

  it("is written in the first person, with no third-person sentence opening", () => {
    const thirdPerson = /(?:^|[.!?]\s+)(?:He|His|She|Her|Wamae|Benson|Integration Owner)\b/;
    for (const { plain } of profile.summary) {
      expect(plain, plain).not.toMatch(thirdPerson);
      expect(plain, plain).not.toMatch(/\b(?:he|she) (?:has|is|was|had)\b/i);
    }
    expect(textOf(mainOf("about"))).not.toMatch(thirdPerson);
    expect(profile.summary.map((p) => p.plain).join(" ")).toMatch(/\bI (?:am|have)\b/);
  });
});

describe("/contact/", () => {
  it("has the configured email as a mailto link", () => {
    expect(mainOf("contact")).toContain('href="mailto:integration@example.invalid"');
  });

  it("opens each profile link where it can be shown: in the window, or in a new tab", () => {
    const html = mainOf("contact");
    for (const link of profile.links) {
      const target = linkTarget(linkRoutes, link.url);
      const attributes = anchorAttributes(html, link.label);
      expect(target, link.label).toBeDefined();
      expect(attributeOf(attributes, "href"), link.label).toBe(target?.href);
      expect(attributeOf(attributes, "target"), link.label).toBe(
        target?.newTab ? "_blank" : undefined,
      );
      expect(attributeOf(attributes, "rel"), link.label).toBe(
        target?.newTab ? "noopener noreferrer" : undefined,
      );
    }
  });

  it("lets only a link that opens a new tab, safely, point at another site", () => {
    outsideLinksOpenSafely(mainOf("contact"));
  });
});

describe("bold figures", () => {
  const strongTexts = (path: string) =>
    [...mainOf(path).matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/g)].map((m) => m[1]);

  it("bolds exactly the marked figures on About, Experience and Projects", () => {
    expect(strongTexts("about")).toEqual(["3X"]);
    expect(strongTexts("experience")).toEqual([
      "80%",
      "66%",
      "3 months",
      "3-4 weeks",
      "GDPR",
      "1000+",
      "100K",
      "10 million",
      "25%",
      "90%",
      "5",
      "COVID-19",
      "100",
    ]);
    expect(strongTexts("projects")).toEqual([
      "80%",
      "66%",
      "3 months",
      "3-4 weeks",
      "GDPR",
      "1000+",
      "100K",
      "10 million",
      "25%",
      "90%",
      "COVID-19",
    ]);
    expect(strongTexts("contact")).toEqual([]);
  });

  it("renders the bold figure inside its sentence as a real strong element", () => {
    expect(mainOf("experience")).toContain("increase of <strong>80%</strong> in revenue");
    expect(mainOf("about")).toContain("brought a <strong>3X</strong> increase");
  });

  it("never shows the marker characters, in any page", async () => {
    for (const path of ["", ...contentPaths]) {
      const html = path === "" ? site.html : (pages[path] as string);
      expect(html, path).not.toContain("**");
      expect(textOf(html), path).not.toContain("*");
    }
  });

  it("uses strong only for the marked figures", () => {
    for (const path of contentPaths) {
      expect(mainOf(path).match(/<strong/g)?.length ?? 0, path).toBe(strongTexts(path).length);
    }
  });
});

describe("whole content", () => {
  it("has no currency symbol, code or amount in any content page", () => {
    for (const path of contentPaths) {
      expect(findCurrency(textOf(mainOf(path))), path).toBeUndefined();
      expect(mainOf(path), path).not.toMatch(/[$£€¥]/);
    }
  });

  it("does not ship the CV file or its text", async () => {
    const files = await site.listFiles(".");
    expect(files.some((name) => /cv/i.test(name))).toBe(false);
    for (const path of contentPaths) expect(pages[path]).not.toMatch(/CV\.md|product\/CV/);
    expect(site.html).not.toMatch(/CV\.md/);
  });

  it("has one h1 per page and keeps content in the HTML, without any script", () => {
    for (const path of contentPaths) {
      expect(pages[path]?.match(/<h1[\s>]/g), path).toHaveLength(1);
      expect(mainOf(path).length, path).toBeGreaterThan(500);
      expect(mainOf(path), path).not.toMatch(/<script/);
    }
  });

  it("opens each certificate with a public link in the window, or in a new tab if it cannot be shown", () => {
    const withLinks = profile.certifications.filter((c) => c.url !== undefined);
    expect(withLinks.length).toBeGreaterThan(0);
    for (const certification of withLinks) {
      const target = linkTarget(linkRoutes, certification.url ?? "");
      const attributes = anchorAttributes(mainOf("about"), certification.name);
      expect(target, certification.name).toBeDefined();
      expect(attributeOf(attributes, "href"), certification.name).toBe(target?.href);
      expect(attributeOf(attributes, "target"), certification.name).toBe(
        target?.newTab ? "_blank" : undefined,
      );
      expect(attributeOf(attributes, "rel"), certification.name).toBe(
        target?.newTab ? "noopener noreferrer" : undefined,
      );
    }
  });

  it("lets only a link that opens a new tab, safely, point at another site", () => {
    outsideLinksOpenSafely(mainOf("about"));
  });
});
