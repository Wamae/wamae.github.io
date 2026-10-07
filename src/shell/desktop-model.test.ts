import { describe, expect, it } from "vitest";
import { iconNames } from "../components/icon-names";
import { contentSections, plainContentId, programGroups } from "./desktop-model";

describe("desktop model", () => {
  const sectionIds = new Set(contentSections.map((section) => section.id));
  const targets = new Set([...sectionIds, plainContentId].map((id) => `#${id}`));

  it("points every program icon at a section that exists", () => {
    for (const item of programGroups.flatMap((group) => group.items)) {
      expect(targets.has(item.href), item.href).toBe(true);
    }
  });

  it("uses only icons that are shipped", () => {
    const icons = [
      ...contentSections.map((section) => section.icon),
      ...programGroups.flatMap((group) => group.items.map((item) => item.icon)),
    ];
    for (const icon of icons) expect(iconNames).toContain(icon);
  });

  it("has unique ids and file names", () => {
    const ids = [...contentSections.map((s) => s.id), ...programGroups.map((g) => g.id)];
    expect(new Set(ids).size).toBe(ids.length);
    const files = contentSections.map((s) => s.fileName);
    expect(new Set(files).size).toBe(files.length);
  });

  it("labels every placeholder so it cannot pass for a real fact", () => {
    for (const section of contentSections) {
      expect(section.placeholder).toContain("content arrives in a later milestone");
    }
  });
});
