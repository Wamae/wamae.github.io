import { describe, expect, it } from "vitest";
import { industries, industrySlug, isIndustry } from "./industries";

describe("industries", () => {
  it("recognises only the fixed list", () => {
    for (const industry of industries) expect(isIndustry(industry)).toBe(true);
    expect(isIndustry("fintech")).toBe(false);
    expect(isIndustry(["Fintech"])).toBe(false);
    expect(isIndustry(undefined)).toBe(false);
  });

  it("includes Agriculture, which may have no project yet", () => {
    expect(industries).toContain("Agriculture");
    expect(industrySlug("Agriculture")).toBe("agriculture");
  });

  it("makes a unique, URL-safe slug for each industry", () => {
    const slugs = industries.map(industrySlug);
    expect(new Set(slugs).size).toBe(industries.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(industrySlug("Public sector / data collection")).toBe("public-sector-data-collection");
  });
});
