import { describe, expect, it } from "vitest";
import { loadProfile } from "./profile";

/** A small valid CV in YAML. Tests change one line of it. */
const valid = `headline: Sample headline
summary:
  - First sample paragraph.
keySkills:
  - Sample skill
roles:
  - id: first-role
    employer: Sample Employer
    title: Sample Title
    start: 2019-02
    end: 2020-06
projects:
  - id: first-project
    roleId: first-role
    title: Sample project
    industry: Fintech
    description: A sample project.
    results: Grew by 10%.
education:
  - institution: Sample University
    qualification: Sample degree
certifications:
  - name: Sample certificate
links:
  - label: Sample
    url: https://example.org/profile
`;

const messageOf = (source: string): string => {
  try {
    loadProfile(source, "sample.yml");
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected the CV to be rejected");
};
const replaceLine = (from: string, to: string) => valid.replace(from, to);

describe("loadProfile", () => {
  it("loads a valid CV", () => {
    expect(loadProfile(valid).roles[0]?.employer).toBe("Sample Employer");
  });

  it("fails a YAML syntax error with the file, the line and the column", () => {
    const message = messageOf(replaceLine("headline: Sample headline", "headline: [unclosed"));
    expect(message).toContain("sample.yml is not valid YAML");
    expect(message).toMatch(/\(\d+:\d+\)/);
  });

  it("names the path and the line of a value that is wrong", () => {
    const message = messageOf(replaceLine("start: 2019-02", "start: someday"));
    expect(message).toContain("roles[0].start: must be a date");
    expect(message).toContain("(line 10)");
  });

  it("names the path of a list item that is wrong", () => {
    const message = messageOf(replaceLine("  - Sample skill", "  - ''"));
    expect(message).toContain("keySkills[0]: must be a non-empty text (line 5)");
  });

  it("names the role id that does not exist, with the line of the project field", () => {
    const message = messageOf(replaceLine("roleId: first-role", "roleId: nobody"));
    expect(message).toContain('projects[0].roleId: unknown role id "nobody" (line 14)');
  });

  it("names a currency in a result", () => {
    const message = messageOf(replaceLine("Grew by 10%.", "Earned KES 500."));
    expect(message).toContain("projects[0].results: contains the currency");
  });

  it("rejects a duplicate key with the parser's message", () => {
    const message = messageOf(replaceLine("    end: 2020-06", "    end: 2020-06\n    end: 2021"));
    expect(message).toContain("duplicated mapping key");
  });

  it("rejects an alias, so repeated data cannot hide", () => {
    const message = messageOf(
      replaceLine("  - Sample skill", "  - &skill Sample skill\n  - *skill"),
    );
    expect(message).toMatch(/alias/i);
  });

  it("rejects a tag that builds a non-plain value", () => {
    const message = messageOf(
      replaceLine("headline: Sample headline", "headline: !!js/function 'x'"),
    );
    expect(message).toContain("unknown scalar tag");
  });

  it("reads quoted text that starts with a bold marker", () => {
    const profile = loadProfile(replaceLine("Grew by 10%.", '"**Grew** by 10%."'));
    expect(profile.projects[0]?.results).toBeDefined();
  });

  it("fails a text that starts with an unquoted asterisk, which YAML reads as an alias", () => {
    const message = messageOf(replaceLine("Grew by 10%.", "**Grew** by 10%."));
    expect(message).toContain("sample.yml is not valid YAML");
  });

  it("fails on empty or non-map files with a clear message", () => {
    expect(messageOf("")).toContain("input is empty");
    expect(messageOf("- a\n- b\n")).toContain("must be an object");
  });
});
