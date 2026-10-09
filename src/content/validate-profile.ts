import { cvFilePath } from "./cv-file";
import { industries, isIndustry } from "./industries";
import { hasOwnDates, readPeriod } from "./read-period";
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
  readOptionalBoolean,
  readOptionalRichText,
  readRichText,
  readRichTextList,
  readRecords,
  rejectUnknownFields,
  readText,
  readTextList,
  type ProblemReporter,
} from "./problem-reporter";
import { sortNewestFirst } from "./sort-newest-first";
import type { LineOf } from "./yaml-line-index";

type Fields = Readonly<Record<string, unknown>>;

const ROLE_FIELDS = ["id", "employer", "title", "start", "end", "description", "highlights"];
const PROJECT_FIELDS = [
  "id",
  "roleId",
  "title",
  "industry",
  "description",
  "results",
  "start",
  "end",
];
const TOP_LEVEL_FIELDS = [
  "headline",
  "summary",
  "keySkills",
  "roles",
  "projects",
  "education",
  "certifications",
  "links",
];

/** Reads the roles. `seen` collects every valid id, even of a role that has other problems. */
function readRoles(raw: unknown, reporter: ProblemReporter, seen: Set<string>): Role[] {
  const roles: Role[] = [];
  readRecords(raw, "roles", reporter).forEach((fields, index) => {
    const path = `roles[${index}]`;
    rejectUnknownFields(fields, ROLE_FIELDS, path, reporter);
    const id = readId(fields["id"], `${path}.id`, seen, reporter);
    const employer = readText(fields["employer"], `${path}.employer`, reporter);
    const title = readText(fields["title"], `${path}.title`, reporter);
    const period = readPeriod(fields, path, reporter);
    const description = readOptionalRichText(
      fields["description"],
      `${path}.description`,
      reporter,
    );
    const highlights =
      fields["highlights"] === undefined
        ? []
        : readRichTextList(fields["highlights"], `${path}.highlights`, reporter, true);
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

function readProjects(
  raw: unknown,
  roles: readonly Role[],
  roleIds: ReadonlySet<string>,
  reporter: ProblemReporter,
): Project[] {
  const seen = new Set<string>();
  const projects: Project[] = [];
  readRecords(raw, "projects", reporter).forEach((fields, index) => {
    const path = `projects[${index}]`;
    rejectUnknownFields(fields, PROJECT_FIELDS, path, reporter);
    const id = readId(fields["id"], `${path}.id`, seen, reporter);
    const roleId = readText(fields["roleId"], `${path}.roleId`, reporter);
    const role = roles.find((candidate) => candidate.id === roleId);
    // A role that exists but has its own problems is reported once, not again for each project.
    if (roleId !== undefined && role === undefined && !roleIds.has(roleId)) {
      reporter.report(`${path}.roleId`, `unknown role id "${roleId}"`);
    }
    const title = readText(fields["title"], `${path}.title`, reporter);
    const industry = readIndustry(fields, `${path}.industry`, reporter);
    const description = readRichText(fields["description"], `${path}.description`, reporter);
    const results = readOptionalRichText(fields["results"], `${path}.results`, reporter);
    const ownPeriod = hasOwnDates(fields) ? readPeriod(fields, path, reporter) : undefined;
    const period = hasOwnDates(fields) ? ownPeriod : role?.period;
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
    rejectUnknownFields(fields, ["institution", "qualification"], `education[${index}]`, reporter);
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
    rejectUnknownFields(fields, ["name", "url", "embed"], path, reporter);
    const name = readText(fields["name"], `${path}.name`, reporter);
    const url =
      fields["url"] === undefined
        ? undefined
        : readHttpsUrl(fields["url"], `${path}.url`, reporter);
    const embed = readOptionalBoolean(fields["embed"], `${path}.embed`, reporter);
    if (name === undefined) return;
    if (fields["url"] !== undefined && url === undefined) return;
    entries.push({
      name,
      ...(url === undefined ? {} : { url }),
      ...(embed === undefined ? {} : { embed }),
    });
  });
  return entries;
}

function readLinks(raw: unknown, reporter: ProblemReporter): ProfileLink[] {
  const entries: ProfileLink[] = [];
  readRecords(raw, "links", reporter).forEach((fields, index) => {
    rejectUnknownFields(fields, ["label", "url", "embed"], `links[${index}]`, reporter);
    const label = readText(fields["label"], `links[${index}].label`, reporter);
    const url = readHttpsUrl(fields["url"], `links[${index}].url`, reporter);
    const embed = readOptionalBoolean(fields["embed"], `links[${index}].embed`, reporter);
    if (label !== undefined && url !== undefined) {
      entries.push({ label, url, ...(embed === undefined ? {} : { embed }) });
    }
  });
  return entries;
}

/** One error that lists every problem, so a build fails with a clear message. */
function validationError(problems: readonly string[], filename: string): Error {
  return new Error(
    `${filename} is invalid (${problems.length} problem(s)):\n- ${problems.join("\n- ")}`,
    { cause: problems },
  );
}

/**
 * Checks the raw data and returns the profile with roles and projects sorted newest first.
 * Throws one error listing every problem found, so a build fails with a clear message.
 */
export function validateProfile(
  raw: unknown,
  lineOf?: LineOf,
  filename: string = cvFilePath,
): Profile {
  const reporter = createProblemReporter(lineOf);
  if (!isRecord(raw)) throw validationError(["the data must be an object"], filename);

  rejectUnknownFields(raw, TOP_LEVEL_FIELDS, "", reporter);
  const headline = readText(raw["headline"], "headline", reporter);
  const summary = readRichTextList(raw["summary"], "summary", reporter, false);
  const keySkills = readTextList(raw["keySkills"], "keySkills", reporter, false);
  const roleIds = new Set<string>();
  const roles = readRoles(raw["roles"], reporter, roleIds);
  const projects = readProjects(raw["projects"], roles, roleIds, reporter);
  const education = readEducation(raw["education"], reporter);
  const certifications = readCertifications(raw["certifications"], reporter);
  const links = readLinks(raw["links"], reporter);

  if (reporter.problems.length > 0 || headline === undefined) {
    throw validationError(reporter.problems, filename);
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
