/**
 * The address shown in the browser window's address bar: the real public URL of a page,
 * built from the configured site URL and the page's path, so nothing is hard-coded.
 * The site is served from the root of its origin (wamae.github.io), so the site URL
 * must not carry a base path.
 */
export function buildAddress(site: string | URL, path: string): string {
  return new URL(path, site).href;
}
