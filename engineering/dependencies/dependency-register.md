# Dependency register

One row for every dependency. Rules are in [dependency-selection-policy.md](dependency-selection-policy.md). A dependency is not adopted until its row is complete.

Status values: `candidate` (proposed, not yet checked), `approved`, `rejected`.

| Name | Kind | Pinned version | Licence | T1 maintained | T2 roadmap | T3 community | T4 security | Date checked | Reviewer | Status | Fallback |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Astro | Framework | _to check_ | _to check_ | | | | | | | candidate | An older Astro major with security support |
| TypeScript | Language | _to check_ | _to check_ | | | | | | | candidate | TypeScript 6.0 |
| Node.js | Runtime | _to check_ | _to check_ | | | | | | | candidate | Previous LTS |
| withastro/action | GitHub Action | _to check_ | _to check_ | | | | | | | candidate | Manual build steps |
| actions/deploy-pages | GitHub Action | _to check_ | _to check_ | | | | | | | candidate | |
| Vitest | Test tool | _to check_ | _to check_ | | | | | | | candidate | |
| Playwright | Test tool | _to check_ | _to check_ | | | | | | | candidate | |
| Open-source icon set | Assets | _to choose_ | _to check_ | | | | | | | candidate | |
| Pixel font | Assets | _to choose_ | _to check_ | | | | | | | candidate | |

The versions and results for these candidates have not been checked against T1 to T4 yet. Fill each row from current sources, with the date checked, before the architecture is baselined.
