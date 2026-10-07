# 0004. Pin TypeScript 6.0.3 until tooling supports 7

- **Status:** accepted
- **Date:** 2026-10-07
- **Decider:** Wamae Benson
- **Charter references:** section 8 (technology), K6

## Context
TypeScript 7.0.2 is the latest stable. `typescript-eslint` 8.71.1 has the peer range `typescript <6.1.0` and `@astrojs/check` 0.9.10 has `^5 || ^6`, so both refuse to install with 7. Linting and type checking need both tools. The policy asks for the latest stable release of every dependency.

## Options considered
1. **Pin TypeScript 6.0.3 and wait:** works with every tool today. Cost: we are one major behind, which the policy normally forbids.
2. **TypeScript 7 with forced peer overrides:** newest compiler. Cost: unsupported combinations, unknown breakage in lint and Astro checks.
3. **Drop `typescript-eslint` or `@astrojs/check`:** removes the blocker. Cost: loses TypeScript linting or `.astro` type checks.

## Decision
Option 1, as a recorded exception to "latest stable". Dependabot ignores TypeScript 7 and later (`>=7`). Move to 7 once both tools declare support, then remove the ignore rule.

## Consequences
- Good: a supported, working toolchain.
- Bad: temporary exception to the staying-current rule, and Dependabot stays silent about 7 until the ignore is removed.
- Follow-ups: re-check the peer ranges of `typescript-eslint` and `@astrojs/check` on each release.

## Evidence
See the "TypeScript 7 note" and the TypeScript row in [dependency-register.md](../../dependencies/dependency-register.md). Checked 2026-10-07.
