import { describe, expect, it } from "vitest";
import { groupProjectsByIndustry } from "./group-projects-by-industry";
import type { Industry } from "./industries";
import type { Project } from "./profile-types";

const project = (id: string, industry: Industry): Project => ({
  id,
  roleId: "role",
  title: id,
  industry,
  description: "Sample text.",
  period: { start: { year: 2020 }, end: null },
  periodIsOwn: false,
});

describe("groupProjectsByIndustry", () => {
  it("puts each project in the group of its one industry", () => {
    const groups = groupProjectsByIndustry([project("a", "Banking"), project("b", "Fintech")]);
    expect(groups.map((group) => [group.industry, group.projects.map((p) => p.id)])).toEqual([
      ["Fintech", ["b"]],
      ["Banking", ["a"]],
    ]);
  });

  it("keeps the given order inside a group", () => {
    const groups = groupProjectsByIndustry([
      project("newest", "IoT"),
      project("middle", "IoT"),
      project("oldest", "IoT"),
    ]);
    expect(groups[0]?.projects.map((p) => p.id)).toEqual(["newest", "middle", "oldest"]);
  });

  it("skips industries with no project", () => {
    expect(groupProjectsByIndustry([project("a", "Staffing")]).map((g) => g.industry)).toEqual([
      "Staffing",
    ]);
    expect(groupProjectsByIndustry([])).toEqual([]);
  });

  it("leaves out an industry that has no project, such as Agriculture", () => {
    const groups = groupProjectsByIndustry([project("a", "Fintech")]);
    expect(groups.map((group) => group.industry)).not.toContain("Agriculture");
    expect(groupProjectsByIndustry([project("a", "Agriculture")]).map((g) => g.industry)).toEqual([
      "Agriculture",
    ]);
  });

  it("counts every project exactly once", () => {
    const all = [project("a", "IoT"), project("b", "Banking"), project("c", "IoT")];
    const total = groupProjectsByIndustry(all).reduce((sum, g) => sum + g.projects.length, 0);
    expect(total).toBe(all.length);
  });
});
