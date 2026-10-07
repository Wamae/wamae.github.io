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
- Pin exact versions and commit the lockfile.
- Assets (icons, fonts, cursors) are dependencies too. Record the licence. They must be open-source or original. Never use Microsoft assets.
- Re-run the checks at each release, when adding a dependency and when upgrading a major version.
- CI runs `npm audit` and fails on high or critical findings. Automated security updates are enabled.
- If a candidate fails a check, use the named fallback, or raise it as a hard decision with the owner.
- Record the adoption of a significant dependency as an ADR (see [adr-writing-guide.md](../architecture/adr-writing-guide.md)).
