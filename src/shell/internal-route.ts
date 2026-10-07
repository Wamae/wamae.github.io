/** Adds a trailing slash, so `/projects` and `/projects/` are the same page. */
function withTrailingSlash(pathname: string): string {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

/**
 * Decides whether a link points at a page of this site that can be opened inside the
 * browser window. Returns the page's canonical path, or `null` for anything else
 * (another site, a file, an unknown page, a malformed URL), which must be left to the browser.
 */
export function resolveInternalRoute(
  href: string,
  currentUrl: string,
  routePaths: readonly string[],
): string | null {
  let target: URL;
  let current: URL;
  try {
    current = new URL(currentUrl);
    target = new URL(href, current);
  } catch {
    return null;
  }
  if (target.origin !== current.origin) return null;
  const path = withTrailingSlash(target.pathname);
  return routePaths.includes(path) ? path : null;
}
