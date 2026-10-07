import { industries, isIndustry } from "./industries";
import { readPeriod } from "./read-period";
import { readId } from "./read-id";
import type {
  Certification,
  Education,
  Profile,
  ProfileLink,
  Project,
  Role,
} from "./profile-types";
import {
  createProblemReporter,
  isRecord,
  readHttpsUrl,
  readOptionalText,
  readRecords,
  readText,
  readTextList,
  type ProblemReporter,
} from "./problem-reporter";
import { sortNewestFirst } from "./sort-newest-first";

type Fields = Readonly<Record<string, unknown>>;

function readRoles(raw: unknown, reporter: ProblemReporter): Role[] {
  const seen = new Set<string>();
  const roles: Role[] = [];
  readRecords(raw, "roles", reporter).forEach((fields, index) => {
    const path = `roles[${index}]`;
    const id = readId(fields["id"], `${path}.id`, seen, reporter);
    const employer = readText(fields["employer"], `${path}.employer`, reporter);
    const title = readText(fields["title"], `${path}.title`, reporter);
    const period = readPeriod(fields["period"], `${path}.period`, reporter);
    const description = readOptionalText(fields["description"], `${path}.description`, reporter);
    const highlights = readTextList(fields["highlights"], `${path}.highlights`, reporter, true);
    if (id === undefined || employer === undefined || title === undefined) return;
    if (period === undefined) return;
    roles.push({
      id,
      employer,
      title,
      period,
      highlights,
      ...(description === undefined ? {} : { description }),
    });
  });
  return roles;
}

/** A project has exactly one industry: one value from the fixed list, never a list. */
function readIndustry(fields: Fields, path: string, reporter: ProblemReporter) {
  const value = fields["industry"];
  if (fields["industries"] !== undefined || Array.isArray(value)) {
    reporter.report(path, `a project has exactly one industry, not a list`);
    return undefined;
  }
  if (!isIndustry(value)) {
    reporter.report(path, `must be exactly one of: ${industries.join(", ")}`);
    return undefined;
  }
  return value;
}

function readProjects(raw: unknown, roles: readonly Role[], reporter: ProblemReporter): Project[] {
  const seen = new Set<string>();
  const projects: Project[] = [];
  readRecords(raw, "projects", reporter).forEach((fields, index) => {
    const path = `projects[${index}]`;
    const id = readId(fields["id"], `${path}.id`, seen, reporter);
    const roleId = readText(fields["roleId"], `${path}.roleId`, reporter);
    const role = roles.find((candidate) => candidate.id === roleId);
    if (roleId !== undefined && role === undefined) {
      reporter.report(`${path}.roleId`, `unknown role id "${roleId}"`);
    }
    const title = readText(fields["title"], `${path}.title`, reporter);
    const industry = readIndustry(fields, `${path}.industry`, reporter);
    const description = readText(fields["description"], `${path}.description`, reporter);
    const results = readOptionalText(fields["results"], `${path}.results`, reporter);
    const ownPeriod =
      fields["period"] === undefined
        ? undefined
        : readPeriod(fields["period"], `${path}.period`, reporter);
    const period = fields["period"] === undefined ? role?.period : ownPeriod;
    if (id === undefined || role === undefined || title === undefined) return;
    if (industry === undefined || description === undefined || period === undefined) return;
    projects.push({
      id,
      roleId: role.id,
      title,
      industry,
      description,
      period,
      periodIsOwn: ownPeriod !== undefined,
      ...(results === undefined ? {} : { results }),
    });
  });
  return projects;
}

function readEducation(raw: unknown, reporter: ProblemReporter): Education[] {
  const entries: Education[] = [];
  readRecords(raw, "education", reporter).forEach((fields, index) => {
    const institution = readText(
      fields["institution"],
      `education[${index}].institution`,
      reporter,
    );
    const qualification = readText(
      fields["qualification"],
      `education[${index}].qualification`,
      reporter,
    );
    if (institution !== undefined && qualification !== undefined) {
      entries.push({ institution, qualification });
    }
  });
  return entries;
}

function readCertifications(raw: unknown, reporter: ProblemReporter): Certification[] {
  const entries: Certification[] = [];
  readRecords(raw, "certifications", reporter).forEach((fields, index) => {
    const path = `certifications[${index}]`;
    const name = readText(fields["name"], `${path}.name`, reporter);
    const url =
      fields["url"] === undefined
        ? undefined
        : readHttpsUrl(fields["url"], `${path}.url`, reporter);
    if (name === undefined) return;
    if (fields["url"] !== undefined && url === undefined) return;
    entries.push({ name, ...(url === undefined ? {} : { url }) });
  });
  return entries;
}

function readLinks(raw: unknown, reporter: ProblemReporter): ProfileLink[] {
  const entries: ProfileLink[] = [];
  readRecords(raw, "links", reporter).forEach((fields, index) => {
    const label = readText(fields["label"], `links[${index}].label`, reporter);
    const url = readHttpsUrl(fields["url"], `links[${index}].url`, reporter);
    if (label !== undefined && url !== undefined) entries.push({ label, url });
  });
  return entries;
}

/** One error that lists every problem, so a build fails with a clear message. */
function validationError(problems: readonly string[]): Error {
  return new Error(
    `The profile data file is invalid (${problems.length} problem(s)):\n- ${problems.join("\n- ")}`,
    { cause: problems },
  );
}

/**
 * Checks the raw data and returns the profile with roles and projects sorted newest first.
 * Throws one error listing every problem found, so a build fails with a clear message.
 */
export function validateProfile(raw: unknown): Profile {
  const reporter = createProblemReporter();
  if (!isRecord(raw)) throw validationError(["the data must be an object"]);

  const headline = readText(raw["headline"], "headline", reporter);
  const summary = readTextList(raw["summary"], "summary", reporter, false);
  const keySkills = readTextList(raw["keySkills"], "keySkills", reporter, false);
  const roles = readRoles(raw["roles"], reporter);
  const projects = readProjects(raw["projects"], roles, reporter);
  const education = readEducation(raw["education"], reporter);
  const certifications = readCertifications(raw["certifications"], reporter);
  const links = readLinks(raw["links"], reporter);

  if (reporter.problems.length > 0 || headline === undefined) {
    throw validationError(reporter.problems);
  }
  return {
    headline,
    summary,
    keySkills,
    roles: sortNewestFirst(roles),
    projects: sortNewestFirst(projects),
    education,
    certifications,
    links,
  };
}
