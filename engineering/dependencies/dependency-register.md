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
| Astro | Framework | 7.3.6 | MIT | Pass. Published 2026-10-06, repo pushed 2026-10-07, not archived | Pass. Public roadmap repo `withastro/roadmap` (pushed 2026-09-28) | Pass. 7.9M weekly downloads, 63k stars | Pass with caution. `npm audit`: 0 findings. A critical RCE (GHSA-26w7-cxv4-gfx2) was fixed in 7.2.8, and 7.3.6 is past it. Astro publishes advisories often, so stay on the latest patch | Pending owner | An older Astro major that still gets security fixes |
| Node.js | Runtime | 24.x LTS in CI | MIT | Pass. Repo pushed 2026-10-07. v26.10.0 released 2026-09-22 | Pass. Official Node release schedule with fixed LTS dates | Pass. 122k stars | Not separately checked. Use the latest 24.x patch and re-check on each release | Pending owner | Node 22 LTS (Astro needs 22.12 or later) |
| TypeScript | Language | 7.0.2 | Apache-2.0 | Pass. v7.0.2 released 2026-08-20, repo pushed 2026-10-07 | **Not verified.** No roadmap or support policy link checked yet | Pass. 365M weekly downloads, 111k stars | Pass. `npm audit`: 0 findings. No published repo advisories found | Pending owner | TypeScript 6.0 |
| Vitest | Test tool | 5.0.3 | MIT | Pass. Released 2026-09-30, repo pushed 2026-10-07 | **Not verified.** No roadmap or support policy link checked yet | Pass. 142M weekly downloads, 17k stars | Pass with caution. `npm audit`: 0 findings. Past critical advisories concerned Browser Mode, which we do not use. Fixed in 4.1.10 and 5.0.0-beta.4 | Pending owner | Jest |
| Playwright (`@playwright/test`) | Test tool | 1.63.0 | Apache-2.0 | Pass. Released 2026-09-04, repo pushed 2026-10-06 | **Not verified.** No roadmap or support policy link checked yet | Pass. 86M weekly downloads, 97k stars | Pass. `npm audit`: 0 findings. No published repo advisories found | Pending owner | Cypress |
| `actions/checkout` | GitHub Action | v7.0.1 | MIT | Pass. Repo pushed 2026-09-29 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | Manual `git clone` step |
| `actions/setup-node` | GitHub Action | v7.0.0 | MIT | Pass. Repo pushed 2026-10-01 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | Pre-installed Node on the runner |
| `actions/configure-pages` | GitHub Action | v6.0.0 | MIT | Pass. Released 2026-03-25, repo pushed 2026-04-02 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | None needed |
| `actions/upload-pages-artifact` | GitHub Action | v5.0.0 | MIT | Pass. Released 2026-04-10, repo pushed 2026-08-03 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | None needed |
| `actions/deploy-pages` | GitHub Action | v5.0.1 | MIT | Pass. Released 2026-09-01 | GitHub-maintained, versioned releases | Pass. Official `actions/*` | Pass. No published advisories | Pending owner | None needed |

"Approved" here means T1 to T4 evidence is recorded and the owner still has to sign off. For TypeScript, Vitest and Playwright the T2 column is not verified, so the rows cannot be marked complete until a roadmap or support policy link is found.

## Rejected
| Name | Reason |
|---|---|
| `withastro/action` | Only 262 stars, which is below the proposed T3 threshold, and the policy prefers fewer dependencies. The deploy workflow uses the official `actions/*` steps instead (`checkout`, `setup-node`, `configure-pages`, `upload-pages-artifact`, `deploy-pages`) |

## Still to choose (candidate)

| Name | Kind | Notes |
|---|---|---|
| Open-source icon set | Assets | Must be open-source. Record the licence and source. Choose when the design system starts |
| Pixel or system-style font | Assets | Must be open-source or original. Not Microsoft's. Subset and self-host |
| Cursors (hourglass and others) | Assets | Draw originals or use an open-licence set |

## Open point from the charter
The charter listed `withastro/action@v3` and `actions/deploy-pages` v4. Both are out of date (current: v6.1.3 and v5.0.1). The charter's version table should be updated to match this register.
