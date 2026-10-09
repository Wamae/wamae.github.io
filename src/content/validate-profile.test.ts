import { describe, expect, it } from "vitest";
import { validateProfile } from "./validate-profile";

/** Neutral sample data: a small valid profile that each test then breaks in one way. */
function validRaw(): Record<string, unknown> {
  return {
    headline: "Sample headline",
    summary: ["First sample paragraph."],
    keySkills: ["Sample skill"],
    roles: [
      {
        id: "first-role",
        employer: "Sample Employer",
        title: "Sample Title",
        start: "2019-02",
        end: "2020-06",
        highlights: ["Did a sample thing."],
      },
      {
        id: "second-role",
        employer: "Other Employer",
        title: "Other Title",
        start: 2021,
        end: null,
        description: "A sample description.",
        highlights: [],
      },
    ],
    projects: [
      {
        id: "first-project",
        roleId: "first-role",
        title: "Sample project",
        industry: "Fintech",
        description: "A sample project.",
        results: "Grew by 10%.",
      },
    ],
    education: [{ institution: "Sample University", qualification: "Sample degree" }],
    certifications: [
      { name: "Sample certificate", url: "https://example.org/certificate" },
      { name: "Certificate without a link" },
    ],
    links: [{ label: "Sample", url: "https://example.org/profile" }],
  };
}

type Mutation = (raw: Record<string, any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any -- test helper edits raw JSON-like data

type Raw = Parameters<Mutation>[0];

function problemsFor(mutate: Mutation): string {
  const raw = validRaw();
  mutate(raw);
  try {
    validateProfile(raw);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected the data to be rejected");
}

describe("validateProfile", () => {
  it("accepts valid data and keeps the optional fields", () => {
    const profile = validateProfile(validRaw());
    expect(profile.roles.map((role) => role.id)).toEqual(["second-role", "first-role"]);
    expect(profile.roles[0]?.description?.plain).toBe("A sample description.");
    expect(profile.certifications[1]?.url).toBeUndefined();
  });

  it("gives a project the period of its role unless it has its own", () => {
    const raw = validRaw();
    (raw["projects"] as Record<string, unknown>[]).push({
      id: "own-period",
      roleId: "first-role",
      title: "Own period",
      industry: "IoT",
      description: "Has its own period.",
      start: "2019-03",
      end: "2019-04",
    });
    const profile = validateProfile(raw);
    expect(profile.projects.find((p) => p.id === "first-project")?.periodIsOwn).toBe(false);
    expect(profile.projects.find((p) => p.id === "own-period")?.periodIsOwn).toBe(true);
    expect(profile.projects.find((p) => p.id === "first-project")?.period).toEqual({
      start: { year: 2019, month: 2 },
      end: { year: 2020, month: 6 },
    });
    expect(profile.projects.find((p) => p.id === "own-period")?.period.end).toEqual({
      year: 2019,
      month: 4,
    });
  });

  it("rejects data that is not an object", () => {
    expect(() => validateProfile("text")).toThrow(/must be an object/);
    expect(() => validateProfile(null)).toThrow(/must be an object/);
  });

  it("rejects a project with an unknown role id", () => {
    expect(problemsFor((raw) => (raw["projects"][0].roleId = "missing-role"))).toContain(
      'projects[0].roleId: unknown role id "missing-role"',
    );
  });

  it("rejects an unknown industry and names the allowed ones", () => {
    const message = problemsFor((raw) => (raw["projects"][0].industry = "Mining"));
    expect(message).toContain("projects[0].industry: must be exactly one of: Fintech, Banking");
  });

  it("rejects a project with no industry", () => {
    expect(problemsFor((raw) => delete raw["projects"][0].industry)).toContain(
      "projects[0].industry",
    );
  });

  it("rejects a project with more than one industry", () => {
    expect(problemsFor((raw) => (raw["projects"][0].industry = ["Fintech", "Banking"]))).toContain(
      "exactly one industry, not a list",
    );
    expect(
      problemsFor((raw) => (raw["projects"][0].industries = ["Fintech", "Banking"])),
    ).toContain("exactly one industry, not a list");
  });

  it.each(["2012-13", "March 2012", "12", "", 20.5])("rejects the bad date %j", (bad) => {
    expect(problemsFor((raw) => (raw["roles"][0].start = bad))).toContain(
      "roles[0].start: must be a date",
    );
  });

  it("rejects an end date before the start date", () => {
    expect(
      problemsFor((raw) => Object.assign(raw["roles"][0], { start: "2021-05", end: "2021-04" })),
    ).toContain("roles[0].end: ends before it starts");
  });

  it("accepts a year-only end in the same year as the start", () => {
    const raw = validRaw();
    const role = (raw["roles"] as Record<string, unknown>[])[0];
    if (role === undefined) throw new Error("sample data has no role");
    role["start"] = "2014-03";
    role["end"] = 2014;
    expect(() => validateProfile(raw)).not.toThrow();
  });

  it("rejects a missing end (ongoing must be written as null)", () => {
    expect(problemsFor((raw) => delete raw["roles"][1].end)).toContain(
      "roles[1].end: must be a date",
    );
  });

  it.each(["employer", "title"])("rejects an empty role %s", (key) => {
    expect(problemsFor((raw) => (raw["roles"][0][key] = "   "))).toContain(
      `roles[0].${key}: must be a non-empty text`,
    );
  });

  it("rejects an empty description and an empty highlight", () => {
    expect(problemsFor((raw) => (raw["roles"][1].description = ""))).toContain(
      "roles[1].description",
    );
    expect(problemsFor((raw) => (raw["roles"][0].highlights = [""]))).toContain(
      "roles[0].highlights[0]",
    );
  });

  it("rejects an empty project title and description", () => {
    expect(problemsFor((raw) => (raw["projects"][0].title = ""))).toContain("projects[0].title");
    expect(problemsFor((raw) => delete raw["projects"][0].description)).toContain(
      "projects[0].description",
    );
  });

  it("rejects an empty summary, skills list or section", () => {
    expect(problemsFor((raw) => (raw["summary"] = []))).toContain("summary");
    expect(problemsFor((raw) => (raw["keySkills"] = []))).toContain("keySkills");
    expect(problemsFor((raw) => (raw["roles"] = []))).toContain("roles: must be a non-empty list");
    expect(problemsFor((raw) => delete raw["education"])).toContain("education");
  });

  it("rejects duplicate role ids and duplicate project ids", () => {
    expect(problemsFor((raw) => (raw["roles"][1].id = "first-role"))).toContain(
      'roles[1].id: duplicate id "first-role"',
    );
    expect(problemsFor((raw) => raw["projects"].push({ ...raw["projects"][0] }))).toContain(
      'projects[1].id: duplicate id "first-project"',
    );
  });

  it("rejects a badly formed id", () => {
    expect(problemsFor((raw) => (raw["roles"][0].id = "Not An Id"))).toContain("roles[0].id");
  });

  it("rejects a link or certificate URL that is not https", () => {
    expect(problemsFor((raw) => (raw["links"][0].url = "http://example.org"))).toContain(
      "links[0].url: must be a valid https link",
    );
    expect(problemsFor((raw) => (raw["certifications"][0].url = "not a url"))).toContain(
      "certifications[0].url",
    );
  });

  it("keeps an embed flag on a link and a certificate, and leaves it out when not given", () => {
    const raw: Raw = validRaw();
    raw["links"][0].embed = false;
    raw["certifications"][0].embed = true;

    const profile = validateProfile(raw);

    expect(profile.links[0]?.embed).toBe(false);
    expect(profile.certifications[0]?.embed).toBe(true);
    expect(profile.certifications[1]).not.toHaveProperty("embed");
  });

  it("rejects an embed flag that is not true or false", () => {
    expect(problemsFor((raw) => (raw["links"][0].embed = "no"))).toContain(
      "links[0].embed: must be true or false",
    );
    expect(problemsFor((raw) => (raw["certifications"][0].embed = 0))).toContain(
      "certifications[0].embed: must be true or false",
    );
  });

  it.each([
    ["$", "Raised $5 for the team"],
    ["USD", "Saved 2000 USD"],
    ["KES", "KES 500 per month"],
    ["£", "Worth £3"],
    ["€", "Saved 4€"],
  ])("rejects currency (%s) in a text field", (currency, text) => {
    expect(problemsFor((raw) => (raw["projects"][0].results = text))).toContain(
      `projects[0].results: contains the currency "${currency}"`,
    );
  });

  it("checks the currency rule in every kind of text field", () => {
    expect(problemsFor((raw) => (raw["summary"][0] = "Made $1 million"))).toContain("summary[0]");
    expect(problemsFor((raw) => (raw["keySkills"][0] = "USD trading"))).toContain("keySkills[0]");
    expect(problemsFor((raw) => (raw["roles"][0].highlights[0] = "Saved £3"))).toContain(
      "roles[0].highlights[0]",
    );
    expect(problemsFor((raw) => (raw["certifications"][0].name = "€ certificate"))).toContain(
      "certifications[0].name",
    );
  });

  it("accepts a bare year and a year-month for the dates", () => {
    const profile = validateProfile(validRaw());
    expect(profile.roles.find((r) => r.id === "second-role")?.period.start).toEqual({ year: 2021 });
    expect(profile.roles.find((r) => r.id === "first-role")?.period.start).toEqual({
      year: 2019,
      month: 2,
    });
  });

  it("requires both dates when a project has its own", () => {
    expect(
      problemsFor((raw) => {
        raw["projects"][0].start = "2019-03";
      }),
    ).toContain("projects[0].end: must be a date");
  });

  it("rejects a field that is not known, which catches typos", () => {
    expect(problemsFor((raw) => (raw["roles"][0].highlight = ["x"]))).toContain(
      "roles[0].highlight: unknown field",
    );
    expect(problemsFor((raw) => (raw["extra"] = "x"))).toContain("extra: unknown field");
  });

  it("lets a role leave out its highlights", () => {
    const raw = validRaw();
    delete (raw["roles"] as Record<string, unknown>[])[0]?.["highlights"];
    expect(validateProfile(raw).roles.find((r) => r.id === "first-role")?.highlights).toEqual([]);
  });

  it("adds the line of the field to a problem when it knows the line", () => {
    const lines = (path: string) => (path === "roles[0].start" ? 12 : undefined);
    const raw = validRaw();
    Object.assign((raw["roles"] as Record<string, unknown>[])[0] ?? {}, { start: "soon" });
    expect(() => validateProfile(raw, lines)).toThrow(
      "roles[0].start: must be a date such as 2012 or 2012-03 (year 1970 to 2100), or null for an end that is still going (line 12)",
    );
  });

  it("falls back to the line of the parent when the field itself is missing", () => {
    const lines = (path: string) => (path === "roles[1]" ? 30 : undefined);
    const raw = validRaw();
    delete (raw["roles"] as Record<string, unknown>[])[1]?.["end"];
    expect(() => validateProfile(raw, lines)).toThrow("roles[1].end: must be a date");
    expect(() => validateProfile(raw, lines)).toThrow("(line 30)");
  });

  describe("bold markers", () => {
    it("turns **figures** into strong segments and keeps the plain text without markers", () => {
      const raw = validRaw();
      Object.assign((raw["projects"] as Record<string, unknown>[])[0] ?? {}, {
        results: "Grew by **10%** in **2** years.",
      });
      const results = validateProfile(raw).projects[0]?.results;
      expect(results?.plain).toBe("Grew by 10% in 2 years.");
      expect(results?.segments.filter((s) => s.kind === "strong").map((s) => s.text)).toEqual([
        "10%",
        "2",
      ]);
    });

    it.each([
      ["summary[0]", (raw: Raw) => (raw["summary"][0] = "Up **3X")],
      ["roles[1].description", (raw: Raw) => (raw["roles"][1].description = "a **** b")],
      ["roles[0].highlights[0]", (raw: Raw) => (raw["roles"][0].highlights[0] = "a **b **c** d**")],
      ["projects[0].description", (raw: Raw) => (raw["projects"][0].description = "5 * 3")],
      ["projects[0].results", (raw: Raw) => (raw["projects"][0].results = "** x**")],
    ])("rejects a bad marker in %s", (path, mutate) => {
      const message = problemsFor(mutate);
      expect(message).toContain(`${path}:`);
      expect(message).toMatch(/bold|asterisk|\*\*/);
    });

    it("names the field of a bad marker", () => {
      expect(problemsFor((raw) => (raw["summary"][0] = "Up **3X"))).toContain(
        "summary[0]: a bold part is never closed",
      );
    });

    it("rejects markers in fields that are plain text", () => {
      for (const mutate of [
        (raw: Raw) => (raw["headline"] = "**Bold** headline"),
        (raw: Raw) => (raw["keySkills"][0] = "**skill**"),
        (raw: Raw) => (raw["roles"][0].title = "**Title**"),
        (raw: Raw) => (raw["projects"][0].title = "**Project**"),
        (raw: Raw) => (raw["certifications"][0].name = "**Cert**"),
      ]) {
        expect(problemsFor(mutate)).toContain("may not contain asterisks");
      }
    });

    it("runs the currency rule on the text without markers", () => {
      expect(problemsFor((raw) => (raw["projects"][0].results = "Made **US**D 5"))).toContain(
        'contains the currency "USD"',
      );
      expect(problemsFor((raw) => (raw["projects"][0].results = "Made $**5**"))).toContain(
        'contains the currency "$"',
      );
    });
  });

  it("reports a broken role once, not again for each of its projects", () => {
    const message = problemsFor((raw) => (raw["roles"][0].start = "soon"));
    expect(message).toContain("1 problem(s)");
    expect(message).not.toContain("unknown role id");
  });

  it("lists every problem at once, not only the first", () => {
    const message = problemsFor((raw) => {
      raw["projects"][0].roleId = "missing-role";
      raw["projects"][0].industry = "Nope";
      raw["roles"][0].start = "soon";
      raw["links"][0].url = "ftp://example.org";
    });
    expect(message).toContain("4 problem(s)");
    for (const path of [
      "projects[0].roleId",
      "projects[0].industry",
      "roles[0].start",
      "links[0].url",
    ]) {
      expect(message).toContain(path);
    }
  });
});
