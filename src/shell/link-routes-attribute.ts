/** The attribute on the page that lists the pages of external links, written when the site is built. */
export const linkRoutesAttribute = "data-link-routes";

const LINK_PATH = /^\/links\/[a-z0-9]+(-[a-z0-9]+)*\/$/;

/**
 * Reads the list of link page paths from the attribute, separated by spaces. Only paths of the form
 * `/links/<slug>/` are kept, once each, and anything else is dropped. The page is the source of the
 * list, so the script never has to read the content file.
 */
export function parseLinkRoutes(raw: string | null | undefined): string[] {
  if (typeof raw !== "string") return [];
  const kept = raw.split(/\s+/).filter((path) => LINK_PATH.test(path));
  return [...new Set(kept)];
}
