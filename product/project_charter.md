# Project Charter: Windows NT 3.1 Retro Personal Website

## 1. Project title, date, version, author

| Field | Value |
|---|---|
| Project | Rebuild of wamae.github.io as a Windows NT 3.1 themed professional site |
| Charter date | 2026-10-07 |
| Version | 0.1 (draft for approval) |
| Prepared by | PMI specialist (PMBOK-aligned), for the project owner |
| Owner / sponsor | Wamae Benson |
| Repository | `wamae.github.io` (branch `main`) |

## 2. Purpose and business justification

The current site is an unmodified Start Bootstrap "Resume" theme: a static `index.html`, Bootstrap 4 beta, jQuery, Gulp 3 and a legacy `.travis.yml`. There is no GitHub Actions workflow. The stack is dated, and the design is generic.

The project replaces it with a distinctive personal site. The site presents Wamae Benson's work experience and the projects he has built, grouped by industry. It uses a Windows NT 3.1 look and feel (Program Manager, File Manager-style windows) as a memorable differentiator for recruiters, clients and peers. It also modernises the toolchain and automates deployment.

## 3. Measurable objectives and success criteria

| ID | Objective | Success criterion (verifiable) | Traces to |
|---|---|---|---|
| O1 | Deliver the NT 3.1 look and feel | Owner sign-off against a theme checklist: 3D bevels, 16-colour VGA palette only (CSS colour tokens limited to the 16 VGA values), system-style fonts, hourglass busy cursor | R1 |
| O2 | Host on github.io | Site is served at `https://wamae.github.io/`. `astro build` outputs static files only, with no server runtime | R2 |
| O3 | Reproduce NT 3.1 animations | Each animation in the section 6 list works in current Chrome, Firefox and Safari. A manual test script passes, with a recorded result per animation | R3 |
| O4 | Modern, current stack | Dependencies pinned to the versions in section 8 (or newer at build start). `npm audit --omit=dev` reports no high or critical findings. Bootstrap, jQuery and Gulp are removed from `package.json` | R3, M1 |
| O5 | Showcase work experience, chronologically | Every entry in `experience` data renders in date order, with the order derived by code from the dates and not by hand | R4, R6 |
| O6 | Showcase projects and industries, chronologically | Every project entry renders with its industry. Projects are ordered by date and can be grouped or filtered by industry | R5, R6 |
| O7 | Content is data-driven | Adding or editing a CV entry needs a change only in the data file, with no template edits. A schema check fails the build on invalid data | R6 |
| O8 | Accessible and performant | Lighthouse (mobile, production URL): Accessibility >= 95, Performance >= 90, Best Practices >= 95, SEO >= 90. No console JavaScript errors on load. Every feature works by keyboard | C3, C4 |
| O9 | Automated deployment | A push to `main` triggers a GitHub Actions build and Pages deploy that completes green with no manual steps. `.travis.yml` is removed | R2, M1 |

## 4. High-level requirements

| ID | Requirement | Objective | Deliverable |
|---|---|---|---|
| R1 | Windows NT 3.1 retro theme: Program Manager, File Manager-style windows, 3D bevels, 16-colour VGA palette, system fonts, hourglass cursor | O1 | D1, D2 |
| R2 | Must run on github.io. Output is static and is deployed through GitHub Actions Pages | O2, O9 | D6 |
| R3 | Use the latest software stack that can reproduce the animations found in Windows NT 3.1 (see section 6 and the verified versions in section 8) | O3, O4 | D3, D4 |
| R4 | Showcase work experience | O5 | D5 |
| R5 | Showcase projects built and the industries they belong to | O6 | D5 |
| R6 | All showcases chronologically ordered. Content is data-driven, because the owner will supply the CV later | O5, O6, O7 | D5 |
| M1 | Migrate away from the Bootstrap/Gulp/jQuery/Travis template (derived from owner brief) | O4, O9 | D7 |
| C3 | Accessibility is a requirement (see section 8) | O8 | D8 |
| C4 | `prefers-reduced-motion` is honoured (see section 8) | O8 | D3, D8 |

## 5. Scope

**In scope**
- New Astro project replacing the existing template files.
- NT 3.1 design system: palette tokens, bevel components, window chrome, Program Manager group windows, File Manager-style list or tree window, icons, cursor.
- Animation engine (section 6).
- Content schema and data file for experience and projects, with chronological sorting and industry grouping.
- Entries loaded from `product/CV.md`. Any sample entry used before M6 must be labelled as a placeholder and must not look like a real fact.
- GitHub Actions workflow for build and Pages deploy. Removal of Gulp, Travis and the Bootstrap/jQuery vendor files.
- Accessibility and reduced-motion handling, a keyboard-operable alternative to mouse-driven window management, and a no-JavaScript readable fallback of the content.
- Updated README with build, content-editing and deploy instructions.

**Out of scope**
- Writing or inventing CV content.
- A backend, CMS, database, comments or analytics (can be a later change).
- A custom domain (open item, section 14).
- Emulating a full OS (a real file system, real application launching, window resizing by drag unless added later).
- Server-side rendering or any non-static hosting.

## 6. Deliverables

| ID | Deliverable |
|---|---|
| D1 | Design tokens and component library: 16-colour VGA palette, bevel borders, title bars, buttons, scroll bars, menus |
| D2 | Desktop shell: Program Manager window with group windows and icons, File Manager-style window for the data views |
| D3 | Animation set. Each item is reproduced as closely as is practical: window open, minimise and maximise/restore as zoom outlines (wireframe rectangle animating between icon and window); Program Manager group-window cascade; hourglass busy state (cursor plus short simulated "loading" on window open); icon selection highlight; screensaver-style canvas (Mystify-style polygons) after an idle timeout or on request |
| D4 | Technology decision record (this charter's section 8, kept updated) |
| D5 | Data schema, data file and views: experience timeline, projects by industry, both sorted chronologically |
| D6 | GitHub Actions workflow deploying to GitHub Pages |
| D7 | Migration: removal of Bootstrap, jQuery, Gulp, `scss/`, `vendor/`, `.travis.yml`, and replacement of `package.json` |
| D8 | Accessibility and performance report (Lighthouse results, keyboard and screen-reader pass, reduced-motion check) |
| D9 | Updated README and content-editing guide |

## 7. Assumptions

1. The CV was received as `product/CV.md` and is the single source of truth for site content. No CV facts are restated in this charter; content is loaded from the CV into the data file at M6.
2. The CV will include enough date information to sort every entry chronologically. Entries with only a year are acceptable if the sort rule for them is agreed (open item).
3. Each project has exactly one industry (owner decision). The data schema allows this to be widened later.
4. The repository stays at `wamae/wamae.github.io` with Pages source set to "GitHub Actions". The owner has rights to change this setting.
5. The owner will review and approve visual fidelity. "Windows NT 3.1 look" is an homage, not a pixel-exact emulator.
6. Current evergreen browsers are the support target. Legacy browsers are not supported.
7. The owner is the sole contributor. No calendar timeline is set; the work is delivered as one continuous effort, in milestone order.

## 8. Constraints

**Platform and delivery**
- Output must be fully static, since it runs on github.io. Deploy through GitHub Actions Pages (`actions/deploy-pages`).
- Zero recurring cost (free GitHub Pages and Actions tiers).

**Accessibility (explicit constraint)**
- Target WCAG 2.2 AA. This covers colour contrast within the 16-colour palette (pairs must be chosen and checked), visible focus, semantic HTML, a logical heading order, and text alternatives for icons.
- The retro windowing UI must be fully operable by keyboard and meaningful to screen readers. Content must be readable without JavaScript.
- Decorative bevels, cursors and canvas effects are marked as decorative and hidden from assistive technology.

**Motion (explicit constraint)**
- `prefers-reduced-motion: reduce` disables the zoom outlines, cascade and screensaver. State changes are instant. The screensaver must never start by itself for these users.
- No animation may flash more than three times per second. A visible control to pause or disable animation is provided.

**Performance (explicit constraint)**
- Lighthouse targets in O8. Ship minimal JavaScript, with no UI framework runtime unless a real need appears. Self-host assets. Respect `prefers-reduced-data` where practical.

**Technology (versions verified 2026-10-07)**

| Component | Verified version | Source and note |
|---|---|---|
| Astro | 7.3.6 (`npm` registry `latest`, requires Node >= 22.12.0) | npm registry, checked 2026-10-07. A web-search summary listed 6.1.10 and 7.0.0, which the registry superseded |
| TypeScript | 7.0.2 (`npm` registry `latest`) | npm registry, checked 2026-10-07. TypeScript 7.0 is the Go-native compiler, released 2026-07-08 per web sources. TypeScript 6.0 (2026-03-23) is the fallback if an Astro or editor-tooling incompatibility appears |
| Node.js | 24.x "Krypton" Active LTS (maintenance from 2026-10-20). Node 26.x becomes Active LTS on 2026-10-28 | Web search, checked 2026-10-07. Use Node 24 in CI now, and move to 26 after it enters LTS and passes the build |
| GitHub Actions | `withastro/action@v3`, `actions/deploy-pages` (v4 per the docs found) | Web search of Astro's deploy guide, checked 2026-10-07. The exact latest tags must be re-checked at implementation, since the search results came from older doc versions |
| Animation and graphics | CSS, Web Animations API, Canvas 2D (browser built-ins, no package) | Stable web platform features, no version to pin |

**Technology decision (R3): confirmed, with refinements**
- Astro (static output) + TypeScript + CSS + Web Animations API + Canvas 2D. Content lives in a YAML or JSON data file validated by a schema (Astro content collections with Zod, or a plain JSON file with a build-time check).
- Why this reproduces the NT 3.1 animations:
  - Zoom outlines: a single absolutely positioned wireframe rectangle (dotted or inverted 1px border, or a canvas overlay). It is animated with the Web Animations API between the icon's bounding rect and the window's rect, using stepped easing to look like the original's discrete frames.
  - Cascade, icon highlight and bevel press states: CSS plus small TypeScript.
  - Hourglass: CSS `cursor` with a custom image, plus a state class during simulated loading.
  - Mystify-style screensaver: Canvas 2D with `requestAnimationFrame`.
- Refinement: use Astro "islands" (plain TypeScript modules, no framework) only for the window manager and screensaver. Everything else is server-rendered at build time, so the content stays readable without JavaScript.
- Rejected: React/Vue, because the JavaScript cost and framework runtime add nothing for this site. Three.js and WebGL, because the NT 3.1 effects are 2D. Keeping Bootstrap, because its styling fights the bevel look.

**Technology sustainability (explicit constraint)**

Every tool, framework, library and GitHub Action used to build, test or deploy the site must meet all four criteria below. This applies to direct dependencies and to build tooling. Browser built-ins (CSS, Web Animations API, Canvas 2D) are exempt because they are web standards.

| # | Criterion | Measurable check |
|---|---|---|
| T1 | Maintainable | Stable release or commit within the last 12 months, and open issues and pull requests are being triaged. Not archived or marked deprecated |
| T2 | Clear roadmap | A published roadmap, release policy or versioning and support policy (for example semver plus an LTS or end-of-life schedule) |
| T3 | Decent community | Active community presence (for example a substantial npm weekly download count, GitHub stars and contributors, and an active chat or forum). The minimum thresholds are set by the project manager at the start of D4 and recorded in the dependency register |
| T4 | No major pending security issue | No unpatched critical or high advisory affecting the pinned version, checked against the GitHub Advisory Database and `npm audit` |

How the constraint is enforced:
- A dependency register (name, pinned version, T1 to T4 evidence, date checked, reviewer) is created as part of D4 and kept in `product/`. A tool is not adopted until its row is complete.
- The current candidates (Astro, TypeScript, Node.js, `withastro/action`, `actions/deploy-pages`) must pass this check before the architecture is baselined. The versions recorded above were only checked for their release numbers. They have not yet been assessed against T1 to T4. If a candidate fails, the fallback is a more established option (for example TypeScript 6.0 in place of 7.0, or an older Astro major with security support).
- The check is repeated at each release and whenever a dependency is added or a major version is upgraded. CI runs `npm audit` and fails on high or critical findings. Dependabot (or equivalent) security updates are enabled.
- Dependencies are kept few: no framework runtime is added without a real need (see Performance).

**Way of working (explicit constraint)**
- Claude writes all code. A Claude Opus review agent reviews the code. Review findings are addressed by Claude before merge.
- Temporary change (owner decision): Gemini was the intended reviewer, but the Gemini CLI is currently unavailable (intermittent API connection failures and model overload). The Opus review agent stands in until Gemini works. Once Gemini is working, the owner decides whether it takes over or adds a second review.
- All work is delivered through a pull request on GitHub from a feature branch. Nothing is pushed to `main` directly.
- Hard decisions (scope changes, technology changes that affect section 8, licensing, publishing personal data) are put to the owner before proceeding.

**Content and ordering decisions (owner, resolved)**
- Hosting URL is the free `wamae.github.io`. No custom domain.
- Entries are ordered newest to oldest. Dates are shown as given in the CV (year or month and year). Where roles overlap, all overlapping roles are displayed.
- One industry per project.
- Icons must be open-source with a recorded licence. Fonts and cursors must also be original or openly licensed, not Microsoft's.
- The owner's name and email are configurable through an environment file (for example `.env`, with a committed `.env.example`), not hard-coded in templates. Because the site is static, these values are public in the built output.
- Revenue and similar results are published as percentages only, never as actual currency values.
- All existing template files (`img/`, `vendor/`, `scss/`, `css/`, `js/`, `LICENSE`, and so on) are deleted. A licence for the new work is recommended at project close.

**Other constraints**
- No invented CV data (see section 7).
- Font, cursor and icon assets must be legally redistributable (open item).

## 9. High-level risks

| ID | Risk | Likelihood | Impact | Response |
|---|---|---|---|---|
| K1 | CV content has gaps or ambiguities (see P10 to P13), so entries are loaded wrongly | Medium | Medium | Resolve P10 to P13 before M6. Owner reviews the rendered entries against the CV. Launch gate requires verified content |
| K2 | The 16-colour palette fails WCAG contrast for some text and background pairs | High | Medium | Choose approved pairs up front (black on white or light grey, white on navy). Test with a contrast checker. Document the allowed pairs |
| K3 | Original fonts, icons or cursors are copyrighted by Microsoft, which creates a licensing problem | High | High | Do not copy Microsoft assets. Use original or openly licensed pixel fonts and self-drawn icons. Record each licence |
| K4 | Retro UI hurts usability or accessibility (hidden content, keyboard traps) | Medium | High | Provide semantic content, a keyboard model, a plain-content fallback and a "skip the desktop" link. Include assistive-technology testing in D8 |
| K5 | Animations cause motion discomfort or performance issues on weak devices | Medium | Medium | Honour `prefers-reduced-motion`, animate only `transform` and `opacity` where possible, cap canvas frame rate, add a pause control |
| K6 | Very new major versions (Astro 7, TypeScript 7) have ecosystem gaps or breaking changes | Medium | Medium | Pin exact versions, commit the lockfile, keep TypeScript 6.0 as the fallback, and run `astro check` in CI |
| K7 | Mobile layout of a windowing metaphor is poor | Medium | Medium | Design a responsive mode (windows become stacked full-width panels). Test at phone width |
| K8 | Pages deployment misconfigured (base path, Pages source not set to Actions) | Low | Medium | Set `site` in the Astro config. Document the repo setting. Test the workflow on a branch before merging |
| K10 | A chosen tool fails the sustainability constraint (T1 to T4), for example a new major version has little community history or an open high-severity advisory | Medium | Medium | Run the dependency register check in D4 before baselining. Use the named fallback, pin versions, and re-check at each release. Fail CI on high or critical `npm audit` findings |
| K9 | Chronological ordering is wrong or ambiguous for entries with partial dates or overlaps | Medium | Low | Agree a sort rule (see section 14). Sort in code, and test it with sample data |

## 10. Milestones

No dates or durations are set. Milestones are delivered in order, and each is complete when its exit criterion is met.

| # | Milestone | Depends on | Exit criterion |
|---|---|---|---|
| M1 | Charter approved | None | Section 15 signed |
| M2 | Foundation: Astro + TypeScript scaffold, Actions deploy, old template removed | M1 | Empty site deploys from `main` to github.io. Gulp, Travis, Bootstrap and jQuery gone |
| M3 | Design system and desktop shell | M2 | Program Manager and File Manager-style windows render with bevels and the VGA palette |
| M4 | Animation set | M3 | All D3 animations pass the manual test script. Reduced-motion behaviour verified |
| M5 | Data model and views with placeholder content | M4 | Schema validates. Experience and projects render chronologically with industries |
| M6 | Real content loaded from `product/CV.md` (CV received; blocked on P10 to P13) | M5, P10 to P13 | All entries from the CV present and the order is verified |
| M7 | Accessibility and performance hardening | M6 | Lighthouse targets (O8) met and the manual keyboard and screen-reader pass recorded |
| M8 | Launch and close | M7 | Production URL verified, README updated, owner sign-off |

## 11. Budget summary

- Cash cost: zero (GitHub Pages and Actions on the free tier, open-source tooling). A custom domain, if chosen, adds a recurring registrar fee (open item, amount not known).
- Effort: not estimated. No timeline is set; the work is to be completed straight away, in milestone order.

## 12. Stakeholders

| Stakeholder | Interest | Influence |
|---|---|---|
| Wamae Benson (owner, sponsor, sole contributor) | Approves scope, supplies the CV, accepts the result | High |
| Recruiters and hiring managers (primary audience) | Quickly find experience and projects | Medium (shapes requirements indirectly) |
| Clients and professional peers | See projects and industries | Low to medium |
| Visitors using assistive technology or reduced motion | Equal access to content | Medium (compliance with C3 and C4) |
| GitHub (platform) | Pages and Actions service limits and terms | Low |

## 13. Project manager, roles and authority level

| Role | Holder | Authority |
|---|---|---|
| Sponsor and approver | Wamae Benson | Approves the charter, scope changes, budget (including any domain purchase) and launch |
| Project manager | Wamae Benson (self-managed). The PMI specialist agent drafts and maintains project documents | Day-to-day schedule and task decisions. Scope, technology choices that change section 8 and licensing decisions need sponsor approval |
| Developer and designer | Wamae Benson, with AI-assisted development | Implementation decisions inside the approved scope |

Change control: any change to R1 to R6, the stack in section 8, or the success criteria in section 3 is recorded as a new charter version.

## 14. Open items and pending inputs

| # | Item | Type | Needed by | Owner |
|---|---|---|---|---|
| P1 | CV with all details | **Received** as `product/CV.md`. The industry for each project is not stated per project; see P11 | Done | Wamae Benson |
| P2 | Custom domain | **Resolved**: use the free `wamae.github.io`, no custom domain | Done | Wamae Benson |
| P3 | Font licensing: choose openly licensed pixel or system-style fonts that resemble the NT 3.1 look. Record the licence for each. Do not copy Microsoft fonts | Decision and research | Before M3 | Wamae Benson |
| P4 | Icon and cursor licensing | **Resolved in part**: icons must be open-source. Record the source and licence for each icon set and cursor. Do not copy Microsoft assets | At M3 | Developer |
| P5 | Sort rule | **Resolved**: newest first. Year-only dates are allowed. Overlapping roles are all displayed | Done | Wamae Benson |
| P6 | Industries per project | **Resolved**: one industry per project. The data model may be widened later | Done | Wamae Benson |
| P7 | Re-check exact GitHub Action tags (`withastro/action`, `actions/deploy-pages`, `actions/checkout`) and move to Node 26 once it is LTS (2026-10-28) | Verification | At M2 | Developer |
| P9 | Existing `img/` assets and template `LICENSE` | **Resolved**: delete all existing files. A licence for the new work is recommended at M8 | At M2 and M8 | Developer |
| P10 | Name and email | **Resolved**: configurable in an env file. The CV summary is rewritten in the first person unless the owner objects | Done | Developer |
| P11 | Industry per project: the CV gives employer context (fintech, banking, staffing, IoT, agriculture) but no industry tag per entry, and no agriculture role is listed. Confirm the industry for each project and employer | Decision | Before M5 | Wamae Benson |
| P12 | Overlapping and inconsistent dates in the CV (display rule resolved by P5; only date accuracy remains): some roles overlap and some end dates differ. Confirm the dates and whether any role is the parent of other contracted roles. Details are in the local CV | Decision | Before M5 | Wamae Benson |
| P13 | Content presentation | **Resolved in part**: revenue shown as percentages only. Still to confirm: employer-confidential figures listed in the local CV, the earliest roles, and the certifications | Before M6 | Wamae Benson |

## 15. Approval and sign-off

| Name | Role | Decision | Signature | Date |
|---|---|---|---|---|
| Wamae Benson | Sponsor and project owner | Approve / Reject / Approve with changes | | |
