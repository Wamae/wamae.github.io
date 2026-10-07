import type { IconName } from "../components/icon-names";

/** The desktop itself: no browser window is open here. */
export const homePath = "/";

export type SectionId =
  "about" | "experience" | "projects" | "contact" | "program-manager" | "file-manager";

interface SectionBase {
  readonly id: SectionId;
  readonly title: string;
  /** The real page URL path, with a trailing slash. */
  readonly path: `/${string}/`;
  readonly icon: IconName;
}

/** A page of the personal site, with its content shown in the browser window. */
export type ContentSection = SectionBase & {
  readonly kind: "content";
  readonly fileName: string;
};

/** One of the M3 programs, shown as a page in the browser window. */
export type ApplicationSection = SectionBase & { readonly kind: "application" };

export type Section = ContentSection | ApplicationSection;

export const sections: readonly Section[] = [
  {
    id: "about",
    kind: "content",
    title: "About Me",
    path: "/about/",
    icon: "user",
    fileName: "about.txt",
  },
  {
    id: "experience",
    kind: "content",
    title: "Work Experience",
    path: "/experience/",
    icon: "briefcase",
    fileName: "experience.txt",
  },
  {
    id: "projects",
    kind: "content",
    title: "Projects",
    path: "/projects/",
    icon: "folder",
    fileName: "projects.txt",
  },
  {
    id: "contact",
    kind: "content",
    title: "Contact",
    path: "/contact/",
    icon: "mail",
    fileName: "contact.txt",
  },
  {
    id: "program-manager",
    kind: "application",
    title: "Program Manager",
    path: "/program-manager/",
    icon: "monitor",
  },
  {
    id: "file-manager",
    kind: "application",
    title: "File Manager",
    path: "/file-manager/",
    icon: "file-text",
  },
];

export const contentSections: readonly ContentSection[] = sections.filter(
  (section): section is ContentSection => section.kind === "content",
);

/** Every URL path that is a page of the site, the desktop included. */
export const routePaths: readonly string[] = [homePath, ...sections.map((section) => section.path)];

export function sectionById(id: SectionId): Section {
  const section = sections.find((candidate) => candidate.id === id);
  if (section === undefined) throw new Error(`Unknown section: ${id}`);
  return section;
}

/** What a link to a page needs to show: the words, the target and the glyph. */
export interface SectionLink {
  readonly label: string;
  readonly href: string;
  readonly icon: IconName;
}

export function linkToSection(id: SectionId): SectionLink {
  const section = sectionById(id);
  return { label: section.title, href: section.path, icon: section.icon };
}

export interface LinkGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly SectionLink[];
}

const linksTo = (ids: readonly SectionId[]) => ids.map(linkToSection);

/** The quick-access folders on the desktop. They are also in the Start menu. */
export const desktopIcons: readonly SectionLink[] = linksTo([
  "about",
  "experience",
  "projects",
  "contact",
]);

/** A deliberate mix of eras: NT 3.1 had no Start menu. */
export const startMenuGroups: readonly LinkGroup[] = [
  {
    id: "programs",
    label: "Programs",
    items: linksTo(["about", "experience", "projects", "contact"]),
  },
  {
    id: "applications",
    label: "Applications",
    items: linksTo(["program-manager", "file-manager"]),
  },
  {
    id: "desktop",
    label: "Desktop",
    items: [{ label: "Show Desktop", href: homePath, icon: "monitor" }],
  },
];

/** The groups shown inside Program Manager. */
export const programGroups: readonly LinkGroup[] = [
  { id: "group-personal", label: "Personal", items: linksTo(["about", "contact"]) },
  { id: "group-work", label: "Work", items: linksTo(["experience", "projects"]) },
  { id: "group-applications", label: "Applications", items: linksTo(["file-manager"]) },
];
