# 0003. commitlint for Conventional Commits

- **Status:** accepted
- **Date:** 2026-10-07
- **Decider:** Wamae Benson
- **Charter references:** section 8 (workflow); see [commit-message-conventions.md](../../workflow/commit-message-conventions.md)

## Context
The commit conventions say a linter runs in CI. We need a tool that checks messages without slowing local work or adding many dependencies.

## Options considered
1. **commitlint with `@commitlint/config-conventional`, run in CI only:** standard, maintained, rules are configurable. Cost: two packages.
2. **commitlint plus husky git hooks:** feedback before the commit. Cost: another dependency, hooks that can be skipped or break other tools, and install-time side effects.
3. **A small own script:** no dependency. Cost: we maintain the parser and the rules ourselves.

## Decision
Option 1. commitlint runs in CI on every pull request commit (`--from` base `--to` head). There is no husky and no local hook. The same command can be run by hand with `npx commitlint --from main --to HEAD`.

## Consequences
- Good: small footprint, one enforcement point that cannot be skipped.
- Bad: a bad message is found only after pushing. Fix it before merge.
- Rule settings: `body-max-line-length` warns above 100 characters (Dependabot bodies are exempt in practice).
- Follow-ups: none.

## Evidence
Register rows for `@commitlint/cli` and `@commitlint/config-conventional` 21.2.3 in [dependency-register.md](../../dependencies/dependency-register.md). Checked 2026-10-07.
