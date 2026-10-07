# 0002. Vitest and Playwright as test tools

- **Status:** accepted
- **Date:** 2026-10-07
- **Decider:** Wamae Benson
- **Charter references:** section 8 (testing), see also the test strategy document

## Context
The test pyramid needs unit tests, integration tests that run a real build, and end-to-end tests in a real browser. The tools must be TypeScript-friendly and pass the dependency policy.

## Options considered
1. **Vitest for unit and integration tests, Playwright for end-to-end tests:** Vitest runs TypeScript with no extra setup and is the usual pair for Astro (Vite based). Playwright drives real browsers and has a built-in web server option. Cost: two tools to maintain.
2. **Jest and Cypress:** well known. Cost: Jest needs extra TypeScript and ESM setup, Cypress is heavier.
3. **Playwright Test for everything:** one tool. Cost: slower feedback for pure unit tests, and it is not designed for fast unit runs.

## Decision
Vitest (unit and integration) and Playwright (end-to-end, Chromium only for now). They fit the stack with the least configuration, and each has a named fallback in the register.

## Consequences
- Good: fast unit feedback, real-browser checks of the production build.
- Bad: the Playwright browser download adds CI time. T2 evidence for Playwright is not verified (see the register).
- Follow-ups: add Firefox or WebKit projects if the charter requires more browsers.

## Evidence
Register rows for Vitest 5.0.3 and Playwright 1.63.0 in [dependency-register.md](../../dependencies/dependency-register.md). Checked 2026-10-07.
