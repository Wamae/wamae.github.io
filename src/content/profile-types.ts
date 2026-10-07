import type { Industry } from "./industries";
import type { Period } from "./partial-date";

export interface Role {
  readonly id: string;
  readonly employer: string;
  readonly title: string;
  readonly period: Period;
  readonly description?: string;
  readonly highlights: readonly string[];
}

export interface Project {
  readonly id: string;
  readonly roleId: string;
  readonly title: string;
  readonly industry: Industry;
  readonly description: string;
  readonly results?: string;
  /** The project's own period, or the period of its role when the data gives none. */
  readonly period: Period;
  /** True when the data gives the project its own period, false when it is the role's period. */
  readonly periodIsOwn: boolean;
}

export interface Education {
  readonly institution: string;
  readonly qualification: string;
}

export interface Certification {
  readonly name: string;
  /** A public link to the credential, only where it clearly matches this certification. */
  readonly url?: string;
}

export interface ProfileLink {
  readonly label: string;
  readonly url: string;
}

/** The validated profile. Roles and projects are already sorted newest first. */
export interface Profile {
  readonly headline: string;
  readonly summary: readonly string[];
  readonly keySkills: readonly string[];
  readonly roles: readonly Role[];
  readonly projects: readonly Project[];
  readonly education: readonly Education[];
  readonly certifications: readonly Certification[];
  readonly links: readonly ProfileLink[];
}
