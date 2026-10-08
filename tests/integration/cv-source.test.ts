import { afterAll, describe, expect, it } from "vitest";
import { buildSiteWithEditedCv, type CopyBuild } from "../support/build-site-copy";

const env = {
  PUBLIC_OWNER_NAME: "Integration Owner",
  PUBLIC_OWNER_EMAIL: "integration@example.invalid",
};
const builds: CopyBuild[] = [];
const build = async (edit: (cv: string) => string) => {
  const result = await buildSiteWithEditedCv(env, edit);
  builds.push(result);
  return result;
};

afterAll(async () => {
  await Promise.all(builds.map((result) => result.remove()));
});

const replaceOnce = (text: string, from: string, to: string): string => {
  if (!text.includes(from)) throw new Error(`test setup: "${from}" is not in content/cv.yml`);
  return text.replace(from, to);
};

describe("the site is made from content/cv.yml alone", () => {
  it("shows an edit to a title, a bold figure and the dates in the built pages", async () => {
    const result = await build((cv) =>
      replaceOnce(
        replaceOnce(
          replaceOnce(cv, "title: Lab Assistant", "title: Edited Lab Title"),
          "Led a team of **5** developers",
          "Led a team of **7** developers",
        ),
        "start: 2014-01",
        "start: 2014-02",
      ),
    );
    expect(result.ok, result.stderr).toBe(true);

    const experience = await result.readFileText("experience/index.html");
    expect(experience).toContain("Edited Lab Title");
    expect(experience).toContain("<strong>7</strong> developers");
    expect(experience).toContain('<time datetime="2014-02">February 2014</time>');
    expect(experience).not.toContain("<strong>5</strong>");
  });

  it("puts an edit to the order of the dates in the built order", async () => {
    const result = await build((cv) =>
      replaceOnce(
        cv,
        "title: Lab Assistant\n    start: 2014-01\n    end: 2014-08",
        "title: Lab Assistant\n    start: 2014-01\n    end: null",
      ),
    );
    expect(result.ok, result.stderr).toBe(true);
    const experience = await result.readFileText("experience/index.html");
    const titles = [...experience.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1]);
    expect(titles[0]).toBe("Lab Assistant");
    expect(experience).toContain("January 2014</time> to present");
  });

  it("fails the build with the path and the line when a date is wrong", async () => {
    const result = await build((cv) => replaceOnce(cv, "end: 2026-08", "end: soonish"));
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain("content/cv.yml is invalid");
    expect(result.stderr).toMatch(/roles\[0\]\.end: must be a date .*\(line \d+\)/);
  });

  it("fails the build with the parser's line and column on a YAML syntax error", async () => {
    const result = await build((cv) =>
      replaceOnce(cv, "headline: Technical Project Manager", "headline: [broken"),
    );
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain("content/cv.yml is not valid YAML");
    expect(result.stderr).toMatch(/\(\d+:\d+\)/);
  });

  it("fails the build when a bold marker is not closed", async () => {
    const result = await build((cv) =>
      replaceOnce(cv, "increase of **80%** in", "increase of **80% in"),
    );
    expect(result.ok).toBe(false);
    expect(result.stderr).toMatch(/projects\[\d+\]\.results: a bold part is never closed/);
  });

  it("fails the build when a result holds a currency amount", async () => {
    const result = await build((cv) =>
      replaceOnce(cv, "an increase of **80%** in revenue", "an increase of $80 in revenue"),
    );
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain('contains the currency "$"');
  });
});
