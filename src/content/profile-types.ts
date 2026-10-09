import type { Segment } from "./emphasis";
import type { Industry } from "./industries";
import type { Period } from "./partial-date";

/** Text that may hold bold figures: the parts to render, and the same text with no markers. */
export interface RichText {
  readonly segments: readonly Segment[];
  readonly plain: string;
}

export interface Role {
  readonly id: string;
  readonly employer: string;
  readonly title: string;
  readonly period: Period;
  readonly description?: RichText;
  readonly highlights: readonly RichText[];
}

export interface Project {
  readonly id: string;
  readonly roleId: string;
  readonly title: string;
  readonly industry: Industry;
  readonly description: RichText;
  readonly results?: RichText;
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
  /** false when the credential's site refuses to be shown in a frame inside the browser window. */
  readonly embed?: boolean;
}

export interface ProfileLink {
  readonly label: string;
  readonly url: string;
  /** false when the site refuses to be shown in a frame inside the browser window. */
  readonly embed?: boolean;
}

/** The validated profile. Roles and projects are already sorted newest first. */
export interface Profile {
  readonly headline: string;
  readonly summary: readonly RichText[];
  readonly keySkills: readonly string[];
  readonly roles: readonly Role[];
  readonly projects: readonly Project[];
  readonly education: readonly Education[];
  readonly certifications: readonly Certification[];
  readonly links: readonly ProfileLink[];
}
