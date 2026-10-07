# Dependency selection policy

Every tool, framework, library, font, icon set and GitHub Action must pass four checks before it is adopted. These come from the charter's technology sustainability constraint. Browser built-ins (CSS, Web Animations API, Canvas 2D) are exempt.

| # | Check | Evidence to record |
|---|---|---|
| T1 | **Maintainable:** a release or commit within the last 12 months, issues and pull requests are triaged, not archived or deprecated | Latest release date, recent commit date, state of the issue tracker |
| T2 | **Clear roadmap:** a published roadmap, release policy or support schedule (for example semver plus LTS or end-of-life dates) | Link to the roadmap or policy |
| T3 | **Decent community:** active users and contributors. Thresholds are set by the project manager when the register is created | Weekly downloads, stars, contributors, activity of chat or forum |
| T4 | **No major pending security issue:** no unpatched critical or high advisory on the pinned version | `npm audit` result, GitHub Advisory Database search, date checked |

## Rules
- A dependency is not adopted until its row in the [dependency register](dependency-register.md) is complete.
- Prefer fewer dependencies. Ask whether a small piece of our own code or a platform feature does the job.
- Pin exact versions and commit the lockfile. Pinning makes builds repeatable. It does not mean staying behind.
- Assets (icons, fonts, cursors) are dependencies too. Record the licence. They must be open-source or original. Never use Microsoft assets.
- Re-run the checks at each release, when adding a dependency and when upgrading a major version.
- CI runs `npm audit` and fails on high or critical findings. Automated security updates are enabled.
- If a candidate fails a check, use the named fallback, or raise it as a hard decision with the owner.
- Record the adoption of a significant dependency as an ADR (see [adr-writing-guide.md](../architecture/adr-writing-guide.md)).

## Staying current (owner decision)
Every external dependency stays on its **latest stable release**.

- "Stable" means a final release. No alpha, beta, release-candidate, canary or nightly builds. If the latest release of a tool is a pre-release, use the latest stable one.
- Updates arrive as pull requests, one dependency or one tightly related group per pull request, using the `build(deps)` commit type. Automated tooling (Dependabot or equivalent) opens them. The tool must pass the dependency policy like any other.
- A major version upgrade is handled like adding a new dependency: re-run T1 to T4, update the [register](dependency-register.md), and record an ADR if the change is significant. If it needs code changes, do them in the same pull request.
- Node.js moves to the newest LTS line once it enters LTS, not before.

### Security patches
A security patch is applied as soon as it is released. How quickly depends on severity. These targets start when the fixed version is available.

| Severity | Apply within | How |
|---|---|---|
| Critical | Same day, immediately | Drop other work. Open a pull request at once, run the full checks, review and merge |
| High | 2 days | Dedicated pull request, normal checks and review |
| Medium | 7 days | Dedicated pull request or the next routine update, whichever is sooner |
| Low | 30 days | Included in the next routine update |

- Severity is the vendor or GitHub Advisory Database rating for the version we use. If it is not rated, treat it as high until assessed.
- A patch is applied even if the advisory seems not to affect how we use the tool, unless the owner decides otherwise and the reason is recorded in the register.
- If no patched version exists yet, apply the vendor's workaround, or ask the owner whether to replace the dependency. Record the decision in the register.
- Security patches that need a breaking upgrade are still applied in time. Raise it with the owner if the work cannot meet the target.
- CI fails on high or critical `npm audit` findings, and a scheduled run checks `main` at least weekly, so a new advisory is found even when nobody is changing code.
- Record the date of each security update in the register.
