import { loadSiteConfig, type SiteConfig } from "./site-config";

export type { SiteConfig } from "./site-config";

/** The one place where the real environment is handed to the config loader. */
export function getSiteConfig(): SiteConfig {
  return loadSiteConfig(import.meta.env);
}
