# Code style

Formatting and basic lint rules are enforced by tools (a formatter and a linter, chosen in an ADR and checked in CI). This document covers what tools cannot enforce.

## Language
- TypeScript in strict mode. No `any` without a comment explaining why. Prefer `unknown` and narrow it.
- Prefer immutable data (`readonly`, `const`). Avoid shared mutable state.
- Prefer small pure functions. Keep side effects (DOM, timers, network) at the edges.

## Naming
- Names say what a thing is or does. Functions are verbs (`sortByStartDateDescending`), types and classes are nouns (`ExperienceEntry`).
- No abbreviations except well-known ones (`id`, `url`).
- Booleans read as questions (`isOverlapping`, `hasFocus`).
- Files are `kebab-case`. One main export per file, and the file is named after it.

## Structure
- Group by feature, not by file type. For example `windows/`, `animation/`, `content/`, each with its own code and tests.
- A feature exposes a small public surface (an `index.ts`). Other features import only from that.
- Dependencies point inward: UI depends on domain logic, never the reverse.
- Keep functions short and flat. Aim for one level of abstraction per function. Extract early returns instead of deep nesting.

## Configuration and secrets
- Owner name and email come from an environment file, not from templates. Commit a `.env.example` with placeholder values. Never commit `.env`.
- The site is static, so any value in the built output is public. Never put real secrets in it.
- Read configuration in one place, validate it at build time and fail with a clear message if it is missing.

## Content rules
- CV content lives in the data file and is validated by a schema at build time.
- Revenue and similar results are shown as percentages only, never as currency values.
- Entries are ordered newest first. Each project has exactly one industry.

## Comments
- Comment why, not what. The code should show what it does.
- Delete commented-out code. Version control has it.
- Public functions and types get a short doc comment when the name alone is not enough.

## Errors
- Fail early with clear messages at the boundary (reading data, reading configuration).
- Do not swallow errors. Do not use exceptions for normal control flow.
- The page must still show readable content if JavaScript fails (see [accessibility](../quality/accessibility-and-reduced-motion-requirements.md)).

## Assets and licences
- Icons, fonts and cursors must be open-source or original. Record the source and licence for each in the dependency register. Never copy Microsoft assets.
