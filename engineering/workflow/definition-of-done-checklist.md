# Definition of done

A change is done, and may be merged, only when every item below is true. Copy the list into the pull request description.

## Code
- [ ] Follows [SOLID](../principles/solid-principles.md) and [composition over inheritance](../principles/composition-over-inheritance.md).
- [ ] Follows the [code style](../principles/coding-style-guide.md). Formatter, linter and type check pass.
- [ ] No dead code, no commented-out code, no leftover debug output.

## Tests
- [ ] Unit tests cover new logic. Integration tests cover how parts work together. End-to-end tests cover the affected user journeys.
- [ ] A bug fix includes a test that failed before the fix.
- [ ] All tests pass locally and in CI.

## Quality
- [ ] Meets [accessibility and motion](../quality/accessibility-and-reduced-motion-requirements.md) rules, including keyboard use and `prefers-reduced-motion`.
- [ ] Meets the [performance](../quality/performance-budget.md) budget.
- [ ] Content is readable with JavaScript off.
- [ ] Checked at phone width.

## Content and licensing
- [ ] Content comes from the validated data file. Entries are ordered newest first.
- [ ] Revenue is shown as percentages only.
- [ ] Icons, fonts and cursors are open-source or original, and are recorded in the dependency register.

## Dependencies and security
- [ ] Any new dependency passes the [dependency policy](../dependencies/dependency-selection-policy.md), and its register row is complete.
- [ ] `npm audit` shows no high or critical findings.
- [ ] No secrets or `.env` committed.

## Process
- [ ] Commits follow [conventional commits](commit-message-conventions.md).
- [ ] The pull request description explains what, why and how to verify.
- [ ] The review has no open blockers.
- [ ] An ADR exists for any significant decision (see [decision records](../architecture/adr-writing-guide.md)).
- [ ] Documentation is updated (README, this guide, the charter if scope changed).
