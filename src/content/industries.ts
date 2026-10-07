/** The fixed list of industries. A project has exactly one. */
export const industries = [
  "Fintech",
  "Banking",
  "Staffing",
  "IoT",
  "Public sector / data collection",
  "Agriculture",
] as const;

export type Industry = (typeof industries)[number];

export function isIndustry(value: unknown): value is Industry {
  return industries.some((industry) => industry === value);
}

/** A stable, URL-safe fragment for an industry, for example "public-sector-data-collection". */
export function industrySlug(industry: Industry): string {
  return industry
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
