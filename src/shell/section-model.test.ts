import { describe, expect, it } from "vitest";
import { iconNames } from "../components/icon-names";
import {
  contentSections,
  desktopIcons,
  homePath,
  linkToSection,
  programGroups,
  routePaths,
  sectionById,
  sections,
  startMenuGroups,
  type SectionLink,
} from "./section-model";

const allLinks = (links: readonly SectionLink[]) => links.map((link) => link.href);

describe("section model", () => {
  it("gives every section a unique id, path and title", () => {
    for (const key of ["id", "path", "title"] as const) {
      const values = sections.map((section) => section[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });

  it("uses real page paths: a leading and a trailing slash, never the desktop path", () => {
    for (const section of sections) {
      expect(section.path).toMatch(/^\/[a-z-]+\/$/);
      expect(section.path).not.toBe(homePath);
    }
    expect(routePaths).toContain(homePath);
    expect(routePaths).toHaveLength(sections.length + 1);
  });

  it("uses only icons that are shipped", () => {
    for (const section of sections) expect(iconNames).toContain(section.icon);
    for (const link of [...desktopIcons, ...startMenuGroups.flatMap((g) => g.items)]) {
      expect(iconNames).toContain(link.icon);
    }
  });

  it("labels every placeholder so it cannot pass for a real fact", () => {
    expect(contentSections).toHaveLength(4);
    for (const section of contentSections) {
      expect(section.placeholder).toContain("content arrives in a later milestone");
    }
  });

  it("has unique file names for the content sections", () => {
    const files = contentSections.map((section) => section.fileName);
    expect(new Set(files).size).toBe(files.length);
  });

  it("puts the four content sections on the desktop", () => {
    expect(desktopIcons.map((icon) => icon.label)).toEqual([
      "About Me",
      "Work Experience",
      "Projects",
      "Contact",
    ]);
  });

  it("lists Work Experience, both applications and the desktop in the Start menu", () => {
    const labels = startMenuGroups.flatMap((group) => group.items.map((item) => item.label));
    expect(labels).toEqual([
      "About Me",
      "Work Experience",
      "Projects",
      "Contact",
      "Program Manager",
      "File Manager",
      "Show Desktop",
    ]);
  });

  it("only links to pages that exist", () => {
    const links = [
      ...desktopIcons,
      ...startMenuGroups.flatMap((group) => group.items),
      ...programGroups.flatMap((group) => group.items),
    ];
    for (const href of allLinks(links)) expect(routePaths, href).toContain(href);
  });

  it("looks sections up by id and fails clearly for an unknown id", () => {
    expect(sectionById("projects").path).toBe("/projects/");
    expect(linkToSection("contact")).toEqual({ label: "Contact", href: "/contact/", icon: "mail" });
    expect(() => sectionById("nope" as never)).toThrow("Unknown section: nope");
  });
});
