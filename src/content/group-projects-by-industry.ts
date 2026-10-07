import { industries, type Industry } from "./industries";
import type { Project } from "./profile-types";

export interface IndustryGroup {
  readonly industry: Industry;
  readonly projects: readonly Project[];
}

/**
 * Groups projects by their one industry. Groups follow the fixed industry list and skip industries
 * with no project. Inside a group the projects keep the order they were given, so pass them
 * newest first.
 */
export function groupProjectsByIndustry(projects: readonly Project[]): IndustryGroup[] {
  return industries
    .map((industry) => ({
      industry,
      projects: projects.filter((project) => project.industry === industry),
    }))
    .filter((group) => group.projects.length > 0);
}
