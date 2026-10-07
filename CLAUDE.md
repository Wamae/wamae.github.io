# wamae.github.io

Personal professional website with a Windows NT 3.1 retro theme, hosted on GitHub Pages at `wamae.github.io` (free domain, no custom domain).

## Read first
- Scope, requirements and constraints: [product/project_charter.md](product/project_charter.md). The charter wins if anything disagrees with it.
- Site content (single source of truth): [product/CV.md](product/CV.md).
- How to code, test, commit and review: [engineering/engineering-guide-index.md](engineering/engineering-guide-index.md). Read the documents it links before writing code.

## Rules that always apply
- **Design:** SOLID. Prefer composition over inheritance; no `extends` on our own classes unless a platform requires it and it is documented.
- **Tests:** unit, integration and end-to-end tests, as set out in `engineering/testing/`. Bug fixes start with a failing test.
- **Commits:** Conventional Commits. One logical change per commit. Commits made by Claude end with the attribution line given for the session.
- **Delivery:** work on a branch and open a pull request on GitHub. Never push to `main` directly. Use the checklist in `engineering/workflow/definition-of-done-checklist.md`.
- **Review:** a Claude Opus review agent reviews the code (temporary stand-in for Gemini). Address every blocker before merge.
- **Hard decisions:** ask the owner first. That means scope, stack or licensing changes, publishing personal data, or anything with a cost.

## Content rules
- Entries are ordered newest first. Overlapping roles are all shown. Year-only dates are allowed.
- One industry per project.
- Revenue and similar results are shown as percentages only, never as currency values.
- Owner name and email come from an environment file (`.env`, with a committed `.env.example`). Never commit `.env`.
- Do not invent CV facts. Anything not in `product/CV.md` must be confirmed with the owner.

## Assets and dependencies
- Icons, fonts and cursors must be open-source or original. Never copy Microsoft assets. Record each in `engineering/dependencies/dependency-register.md`.
- Every dependency must pass the T1 to T4 check in `engineering/dependencies/dependency-selection-policy.md` before it is adopted.

## Quality bars
- WCAG 2.2 AA, full keyboard use, content readable without JavaScript, and `prefers-reduced-motion` respected. See `engineering/quality/`.
- Performance budgets are in `engineering/quality/performance-budget.md`.

## Tooling
- Node.js, with the stack chosen in the charter (Astro, TypeScript, CSS, Web Animations API, Canvas 2D). Versions are pinned and recorded in the dependency register.
- GitHub CLI (`gh`) is installed and logged in over HTTPS with a fine-grained token limited to this repository.
- The Gemini CLI is installed but currently unreliable. Run it with `--skip-trust` only on this repository.
