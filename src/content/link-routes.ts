import type { Profile } from "./profile-types";

/** One external link, as a page of this site that shows it inside the browser window. */
export interface LinkRoute {
  /** Short, unique, lowercase name used in the page address. */
  readonly slug: string;
  /** The page of this site, for example `/links/github/`. */
  readonly path: string;
  /** The external https address that the page shows. */
  readonly url: string;
  /** What the link is called, from the content file. */
  readonly label: string;
  /** false when the site is known to refuse being shown in a frame; undefined means try. */
  readonly embed: boolean | undefined;
}

const LINK_PATH_PREFIX = "/links/";

/** Turns a label into lowercase words joined by hyphens. Accents are dropped, symbols become gaps. */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "link" : slug;
}

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/** Gives a slug a numeric suffix until it is not taken yet. */
function uniqueSlug(wanted: string, taken: Set<string>): string {
  let slug = wanted;
  for (let count = 2; taken.has(slug); count++) slug = `${wanted}-${count}`;
  taken.add(slug);
  return slug;
}

/**
 * Lists every external link in the content (the links first, then the certifications that have a
 * link) as a page of this site. The list is the only set of external addresses the browser window
 * can show, so a visitor can never point it at an address that is not in the content file.
 * Entries that are not https links are left out.
 */
export function buildLinkRoutes(profile: Pick<Profile, "links" | "certifications">): LinkRoute[] {
  const taken = new Set<string>();
  const entries: { label: string; url: string; embed: boolean | undefined }[] = [
    ...profile.links.map((link) => ({ label: link.label, url: link.url, embed: link.embed })),
    ...profile.certifications.flatMap((certification) =>
      certification.url === undefined
        ? []
        : [{ label: certification.name, url: certification.url, embed: certification.embed }],
    ),
  ];
  return entries
    .filter((entry) => isHttps(entry.url))
    .map((entry) => {
      const slug = uniqueSlug(slugify(entry.label), taken);
      return { slug, path: `${LINK_PATH_PREFIX}${slug}/`, ...entry };
    });
}

/** The page addresses of the given routes, in the same order. */
export function linkRoutePaths(routes: readonly LinkRoute[]): string[] {
  return routes.map((route) => route.path);
}
