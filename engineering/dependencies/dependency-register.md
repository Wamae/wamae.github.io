# Dependency register

One row for every dependency. Rules are in [dependency-selection-policy.md](dependency-selection-policy.md). A dependency is not adopted until its row is complete.

Status values: `candidate` (proposed, not fully checked), `approved`, `rejected`.

Checked on **2026-10-07** by Claude, from the npm registry, the npm download API, the GitHub API and `npm audit`. The owner reviews and signs off.

## T3 thresholds (proposed, owner to confirm)
- npm packages: at least 1,000,000 weekly downloads and at least 5,000 GitHub stars.
- GitHub Actions: published by GitHub (`actions/*`) or by the framework's own organisation.
- Assets (icons, fonts): an established open-source project with a stated licence. No download threshold.

## Approved

| Name | Kind | Pinned version | Licence | T1 maintained | T2 roadmap or policy | T3 community | T4 security | Reviewer | Fallback |
|---|---|---|---|---|---|---|---|---|---|
| Astro ([ADR 0001](../architecture/adr/0001-astro-static-framework.md)) | Framework | 7.3.6 | MIT | Pass. Published 2026-10-06, repo pushed 2026-10-07, not archived | Pass. Public roadmap repo `withastro/roadmap` (pushed 2026-09-28) | Pass. 7.9M weekly downloads, 63k stars | Pass with caution. `npm audit`: 0 findings. A critical RCE (GHSA-26w7-cxv4-gfx2) was fixed in 7.2.8, and 7.3.6 is past it. Astro publishes advisories often, so stay on the latest patch | Pending owner | An older Astro major that still gets security fixes |
| Node.js | Runtime | 24.x LTS in CI | MIT | Pass. Repo pushed 2026-10-07. v26.10.0 released 2026-09-22 | Pass. Official Node release schedule with fixed LTS dates | Pass. 122k stars | Not separately checked. Use the latest 24.x patch and re-check on each release | Pending owner | Node 22 LTS (Astro needs 22.12 or later) |
| TypeScript ([ADR 0004](../architecture/adr/0004-pin-typescript-6.md)) | Language | 6.0.3 (see note) | Apache-2.0 | Pass. v6.0.3 released 2026-04-16, repo pushed 2026-10-07 | **Partly verified.** The 7.0 announcement states the cadence, "new featureful versions published every 3-4 months": https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ (checked 2026-10-07). The wiki roadmap (https://github.com/microsoft/TypeScript/wiki/Roadmap) is stale (it lists 2021 plans and TypeScript 5.0 from 2023). No formal support or end-of-life schedule found | Pass. 365M weekly downloads, 111k stars | Pass. `npm audit`: 0 findings (re-checked 2026-10-07 after install) | Pending owner | TypeScript 7.0.2 once the tools below support it |
| Vitest ([ADR 0002](../architecture/adr/0002-vitest-and-playwright.md)) | Test tool | 5.0.3 | MIT | Pass. Released 2026-09-30, repo pushed 2026-10-07 | Pass. Semver, release cycle and supported-versions policy: https://vitest.dev/releases (checked 2026-10-07). `SECURITY.md` points to it | Pass. 142M weekly downloads, 17k stars | Pass with caution. `npm audit`: 0 findings. Past critical advisories concerned Browser Mode, which we do not use. Fixed in 4.1.10 and 5.0.0-beta.4 | Pending owner | Jest |
| Playwright (`@playwright/test`) ([ADR 0002](../architecture/adr/0002-vitest-and-playwright.md)) | Test tool | 1.63.0 | Apache-2.0 | Pass. Released 2026-09-04, repo pushed 2026-10-06 | **Not verified.** Searched the docs, release notes, `SUPPORT.md`, `SECURITY.md`, `CONTRIBUTING.md` and GitHub milestones (2026-10-07). Found no roadmap, release policy or support schedule. Only observed behaviour: roughly monthly minor releases (1.60 to 1.63, May to September 2026) with release notes at https://playwright.dev/docs/release-notes | Pass. 86M weekly downloads, 97k stars | Pass. `npm audit`: 0 findings. No published repo advisories found | Pending owner | Cypress |
| `actions/checkout` | GitHub Action | v7.0.1 | MIT | Pass. Repo pushed 2026-09-29 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | Manual `git clone` step |
| `actions/setup-node` | GitHub Action | v7.0.0 | MIT | Pass. Repo pushed 2026-10-01 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | Pre-installed Node on the runner |
| `actions/upload-pages-artifact` | GitHub Action | v5.0.0 | MIT | Pass. Released 2026-04-10, repo pushed 2026-08-03 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | None needed |
| `actions/deploy-pages` | GitHub Action | v5.0.1 | MIT | Pass. Released 2026-09-01 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | None needed |
| ESLint | Lint tool | 10.12.0 | MIT | Pass. Released 2026-10-02, repo pushed 2026-10-07 | Pass. Published support policy: https://eslint.org/version-support | Pass. 198M weekly downloads, 28k stars | Pass. `npm audit`: 0 findings (2026-10-07) | Pending owner | Biome |
| `@eslint/js` | Lint tool | 10.0.1 | MIT | Pass. Released 2026-02-06, same repo as ESLint (pushed 2026-10-07) | Pass. Follows ESLint's policy (link above) | Pass. 176M weekly downloads, 28k stars | Pass. `npm audit`: 0 findings (2026-10-07) | Pending owner | None needed |
| `typescript-eslint` | Lint tool | 8.71.1 | MIT | Pass. Released 2026-10-05, repo pushed 2026-10-07 | Pass. Published version policy: https://typescript-eslint.io/users/dependency-versions. Its peer range is `typescript <6.1.0`, so it does not support TypeScript 7 yet | Pass. 113M weekly downloads, 16k stars | Pass. `npm audit`: 0 findings (2026-10-07) | Pending owner | ESLint core rules only, with no TypeScript linting |
| Prettier | Format tool | 3.9.9 | MIT | Pass. Released 2026-09-23, repo pushed 2026-10-06 | **Not verified.** Searched the docs, `CONTRIBUTING.md` and `.github/SECURITY.md` (2026-10-07). Found no roadmap or versioning policy. Only observed behaviour: frequent patch releases (3.9.4 to 3.9.9, June to September 2026), and the install docs say to pin the exact version because formatting changes between releases: https://prettier.io/docs/install | Pass. 169M weekly downloads, 52k stars | Pass. `npm audit`: 0 findings (2026-10-07). No published repo advisories | Pending owner | Biome |
| `eslint-plugin-astro` ([ADR 0005](../architecture/adr/0005-waive-t3-astro-plugins.md)) | Lint tool | 3.2.1 | MIT | Pass. Released 2026-09-17, repo `ota-meshi/eslint-plugin-astro` pushed 2026-10-07, issues closed 2026-10-07, not archived | Partly verified. Releases managed with changesets and a `CHANGELOG.md`: https://github.com/ota-meshi/eslint-plugin-astro/blob/main/CONTRIBUTING.md. Peer `eslint >=10`. No roadmap | **Waived by the owner** (ADR 0005, 2026-10-07). 1.1M weekly downloads (passes), 432 stars (below the 5,000 threshold), 23 contributors. Reason: standard Astro tooling | Pass. `npm audit`: 0 findings (2026-10-07). No published repo advisories | Pending owner | Rejected-position fallback: no ESLint on `.astro` files, `astro check` only |
| `prettier-plugin-astro` ([ADR 0005](../architecture/adr/0005-waive-t3-astro-plugins.md)) | Format tool | 1.1.0 | MIT | Pass. Released 2026-09-24, repo `withastro/prettier-plugin-astro` (official Astro organisation) pushed 2026-10-05, issues closed 2026-09-24, not archived | Partly verified. Releases managed with changesets and a `CHANGELOG.md`: https://github.com/withastro/prettier-plugin-astro/blob/main/CONTRIBUTING.md. Peer `prettier ^3.5.3`. No roadmap | **Waived by the owner** (ADR 0005, 2026-10-07). 1.5M weekly downloads (passes), 609 stars (below the 5,000 threshold), 30 contributors. Reason: standard Astro tooling | Pass. `npm audit`: 0 findings (2026-10-07). No published repo advisories | Pending owner | Rejected-position fallback: `.astro` files not formatted |
| `@astrojs/check` | Type check tool | 0.9.10 | MIT | Pass. Released 2026-07-27, monorepo `withastro/astro` pushed 2026-10-07 | Pass. Part of the Astro project and its roadmap (`withastro/roadmap`). Its peer range is `typescript ^5 \|\| ^6`, so it does not support TypeScript 7 yet | Pass. 4.6M weekly downloads, 63k stars (monorepo) | Pass. `npm audit`: 0 findings (2026-10-07) | Pending owner | `tsc --noEmit` for `.ts` files only |
| `@commitlint/cli` ([ADR 0003](../architecture/adr/0003-commitlint-conventional-commits.md)) | Commit lint tool | 21.2.3 | MIT | Pass. Released 2026-09-19, repo pushed 2026-10-07 | Pass. Published release support page: https://commitlint.js.org/support/releases | Pass. 13M weekly downloads, 19k stars | Pass. `npm audit`: 0 findings (2026-10-07) | Pending owner | A small own script checking the commit subject pattern |
| `@commitlint/config-conventional` | Commit lint tool | 21.2.3 | MIT | Pass. Released 2026-09-19, same repo as the CLI | Pass. Follows commitlint's policy (link above) | Pass. 13M weekly downloads, 19k stars | Pass. `npm audit`: 0 findings (2026-10-07) | Pending owner | Own rules file |

"Approved" here means T1 to T4 evidence is recorded and the owner still has to sign off. T2 is only partly verified for TypeScript and the two Astro plugins, and not verified for Playwright and Prettier, because no genuine roadmap or support policy was found. Those cells say so and are left open for the owner to accept or for a later check.

## T3 waivers
- `eslint-plugin-astro` and `prettier-plugin-astro`: waived by the owner on 2026-10-07 ([ADR 0005](../architecture/adr/0005-waive-t3-astro-plugins.md)). Reason: standard Astro tooling, 1.1M and 1.5M weekly downloads, below the 5,000-star threshold. The waiver covers only the star threshold for these two packages.

## Rejected
| Name | Reason |
|---|---|
| `withastro/action` | Only 262 stars, which is below the proposed T3 threshold, and the policy prefers fewer dependencies. The deploy workflow uses the official `actions/*` steps instead (`checkout`, `setup-node`, `upload-pages-artifact`, `deploy-pages`). `actions/configure-pages` was dropped on 2026-10-07 because a plain artifact deploy does not need it (see the note below) |

## Still to choose (candidate)

| Name | Kind | Notes |
|---|---|---|
| Open-source icon set | Assets | Must be open-source. Record the licence and source. Choose when the design system starts |
| Pixel or system-style font | Assets | Must be open-source or original. Not Microsoft's. Subset and self-host |
| Cursors (hourglass and others) | Assets | Draw originals or use an open-licence set |

## Open point from the charter
Resolved at M2 (2026-10-07): the charter's action table now lists the tags in this register.

## TypeScript 7 note (2026-10-07)
TypeScript 7.0.2 is the latest stable, but `typescript-eslint` 8.71.1 (peer `<6.1.0`) and `@astrojs/check` 0.9.10 (peer `^5 || ^6`) both refuse to install with it. Type checking and linting need both, so the project is pinned to **TypeScript 6.0.3**, the register's named fallback, until those tools support 7. This is flagged to the owner as a decision. Recheck on each tool release.

## `actions/configure-pages` removed (2026-10-07)
The deploy workflow no longer uses it. It reads Pages settings and can enable Pages or set a base path for a framework. This repository needs none of that: the Astro `site` is fixed in `astro.config.mjs` with no `base`, and Pages is switched to the "GitHub Actions" source by hand. `actions/upload-pages-artifact` and `actions/deploy-pages` are enough for a plain artifact deploy. One dependency fewer.
