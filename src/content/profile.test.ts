import { describe, expect, it } from "vitest";
import { industries } from "./industries";
import { findCurrency } from "./currency-rule";
import { getProfile } from "./profile";
import profileData from "./profile.json";

describe("the real profile data file", () => {
  const profile = getProfile();

  it("passes validation", () => {
    expect(() => getProfile()).not.toThrow();
  });

  it("gives every project one industry from the fixed list and a role that exists", () => {
    const roleIds = new Set(profile.roles.map((role) => role.id));
    for (const project of profile.projects) {
      expect(industries, project.id).toContain(project.industry);
      expect(roleIds.has(project.roleId), project.id).toBe(true);
    }
  });

  it("lists the roles with the newest first", () => {
    expect(profile.roles.map((role) => role.id)).toEqual([
      "kopo-kopo-tpm",
      "droid-pwani",
      "andela",
      "indeed-flex",
      "azenia",
      "kopo-kopo-inc",
      "numeral-iot",
      "baraton-lab-assistant",
      "softcall",
    ]);
  });

  it("lists the projects with the newest first", () => {
    const roleOrder = profile.roles.map((role) => role.id);
    const positions = profile.projects.map((project) => roleOrder.indexOf(project.roleId));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("keeps the order of the data file for the projects inside one role", () => {
    const idsOf = (roleId: string) =>
      profile.projects.filter((project) => project.roleId === roleId).map((project) => project.id);
    expect(idsOf("kopo-kopo-tpm")).toEqual(["move-money", "free-mpesa", "engineer-onboarding"]);
    expect(idsOf("indeed-flex")).toEqual(["bug-triage-and-security", "rate-card-migration"]);
    expect(idsOf("azenia")).toEqual([
      "paypal-withdrawals",
      "service-degradation",
      "western-union",
      "congo-app-support",
    ]);
    expect(idsOf("kopo-kopo-inc")).toEqual([
      "kopo-kopo-flutter-app",
      "kopo-kopo-android-app",
      "communications-service",
    ]);
    expect(idsOf("numeral-iot")).toEqual(["numeral-android-apps", "numeral-prototypes"]);
    expect(idsOf("softcall")).toEqual(["softcall-mobile-banking", "softcall-open-data-kit"]);
  });

  it("lists each certification once, in CV order, and links only those the old site identified", () => {
    expect(profile.certifications.map((c) => [c.name, c.url !== undefined])).toEqual([
      ["Professional Scrum Master certification", true],
      ["IBM Banking and financial industry intro", true],
      ["Google Android Developer certification", true],
      ["Android Unit Testing and Test-Driven Development", true],
      ["Introduction to Python for data science", true],
      ["Cleaning data in Python", true],
      ["Intermediate Python", true],
      ["Introduction to importing data in Python", true],
      ["Python data science toolbox", false],
    ]);
  });

  it("holds no currency anywhere in the file text", () => {
    expect(findCurrency(JSON.stringify(profileData))).toBeUndefined();
  });

  it("uses only https links", () => {
    for (const link of profile.links) expect(link.url.startsWith("https://")).toBe(true);
  });
});
