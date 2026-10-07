import type { IconName } from "../components/icon-names";

/** Where the plain, semantic content starts. The "skip the desktop" link points here. */
export const plainContentId = "plain-content";

export interface ContentSection {
  readonly id: string;
  readonly title: string;
  readonly icon: IconName;
  readonly fileName: string;
  /** Clearly labelled placeholder text. Real content arrives in a later milestone. */
  readonly placeholder: string;
}

export interface ProgramItem {
  readonly label: string;
  readonly href: `#${string}`;
  readonly icon: IconName;
}

export interface ProgramGroup {
  readonly id: string;
  readonly title: string;
  readonly items: readonly ProgramItem[];
}

export const contentSections: readonly ContentSection[] = [
  {
    id: "experience",
    title: "Experience",
    icon: "briefcase",
    fileName: "experience.txt",
    placeholder: "Experience: content arrives in a later milestone.",
  },
  {
    id: "projects",
    title: "Projects",
    icon: "folder",
    fileName: "projects.txt",
    placeholder: "Projects by industry: content arrives in a later milestone.",
  },
  {
    id: "about",
    title: "About",
    icon: "user",
    fileName: "about.txt",
    placeholder: "About: content arrives in a later milestone.",
  },
  {
    id: "contact",
    title: "Contact",
    icon: "mail",
    fileName: "contact.txt",
    placeholder: "Contact: content arrives in a later milestone.",
  },
];

export const programGroups: readonly ProgramGroup[] = [
  {
    id: "group-experience",
    title: "Experience",
    items: [{ label: "Work experience", href: "#experience", icon: "briefcase" }],
  },
  {
    id: "group-projects",
    title: "Projects",
    items: [{ label: "Projects by industry", href: "#projects", icon: "folder" }],
  },
  {
    id: "group-about",
    title: "About",
    items: [
      { label: "About me", href: "#about", icon: "user" },
      { label: "Contact", href: "#contact", icon: "mail" },
    ],
  },
  {
    id: "group-accessories",
    title: "Accessories",
    items: [{ label: "Plain content", href: `#${plainContentId}`, icon: "monitor" }],
  },
];
