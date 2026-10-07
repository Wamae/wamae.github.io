# 0001. Astro as the static framework

- **Status:** accepted
- **Date:** 2026-10-07
- **Decider:** Wamae Benson
- **Charter references:** O2, section 8 (technology), K6

## Context
The site is hosted on GitHub Pages, so it must build to static files with no server runtime. Content must stay readable without JavaScript. Only small parts (window manager, screensaver) need client scripts. The dependency policy prefers few, sustainable dependencies.

## Options considered
1. **Astro:** static output by default, ships no JavaScript unless asked, TypeScript built in, `.astro` components render at build time. Cost: a young major (7) with frequent security advisories, so we stay on the latest patch.
2. **Plain HTML, CSS and TypeScript with a small own build script:** fewest dependencies. Cost: we would write templating, routing and asset handling ourselves.
3. **A React or Vue based framework (for example Next.js static export):** large ecosystem. Cost: ships a runtime, heavier dependency tree, and no benefit for a mostly static page.

## Decision
Astro, with `output: "static"`. It gives build-time rendering and islands for the few interactive parts, with the smallest runtime cost.

## Consequences
- Good: readable without JavaScript, static output suits Pages, TypeScript support is built in.
- Bad: Astro security advisories are frequent, so patches must be applied on the policy schedule. `@astrojs/check` and the Astro plugins for ESLint and Prettier are extra dependencies (see ADR 0004 and 0005).
- Follow-ups: re-run T1 to T4 at each major upgrade.

## Evidence
Dependency register row: Astro 7.3.6 in [dependency-register.md](../../dependencies/dependency-register.md). Checked 2026-10-07.
