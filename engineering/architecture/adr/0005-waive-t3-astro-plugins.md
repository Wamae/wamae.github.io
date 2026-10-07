# 0005. Waive T3 for the two Astro plugins

- **Status:** accepted
- **Date:** 2026-10-07
- **Decider:** Wamae Benson
- **Charter references:** section 8 (technology sustainability, T3)

## Context
`eslint-plugin-astro` (432 stars) and `prettier-plugin-astro` (609 stars) are below the proposed T3 threshold of 5,000 stars. Without them ESLint and Prettier ignore `.astro` files, so the site's templates would be neither linted nor formatted. Both have over 1 million weekly downloads, pass T1 and T4, and T2 is only partly verified (both use changesets and a changelog, but neither publishes a roadmap or support policy), and have no maintained alternative.

## Options considered
1. **Adopt both with a T3 waiver:** `.astro` files get linted and formatted. Cost: two small-community dependencies, and a documented exception to the policy.
2. **Reject both (the earlier position):** no extra dependencies. Cost: `.astro` files only get `astro check`, with no style or lint rules.
3. **Switch to Biome:** one tool. Cost: a different stack, and its Astro support is partial.

## Decision
Option 1. The owner waives T3 for these two packages because they are standard Astro tooling with high download counts. The waiver covers only these two packages and only the star threshold.

## Consequences
- Good: consistent lint and format for all source files.
- Bad: if a plugin goes unmaintained, we fall back to Option 2. `eslint-plugin-astro` 3.2.1 needs Node `^22.22.3 || ^24.16.0 || >=26.3.0`.
- Follow-ups: re-check T1 and T4 at each release.

## Evidence
Register rows for both plugins in [dependency-register.md](../../dependencies/dependency-register.md). Checked 2026-10-07.
