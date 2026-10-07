## What and why
<!-- The problem and the approach. The pull request title follows Conventional Commits. -->

## How to verify
<!-- Commands or steps to see it work. Add screenshots for visual changes, including phone width and reduced motion. -->

## Notes and decisions
<!-- Trade-offs, follow-ups, and any hard decision the owner needs to make. -->

## Definition of done
See [engineering/workflow/definition-of-done-checklist.md](../engineering/workflow/definition-of-done-checklist.md).

**Code**
- [ ] Follows SOLID and composition over inheritance
- [ ] Formatter, linter and type check pass
- [ ] No dead code or debug output

**Tests**
- [ ] Unit, integration and end-to-end tests cover the change
- [ ] A bug fix includes a test that failed before the fix
- [ ] All tests pass

**Quality**
- [ ] Keyboard use, accessibility and `prefers-reduced-motion` checked
- [ ] Performance budget met
- [ ] Content readable with JavaScript off
- [ ] Checked at phone width

**Content and licensing**
- [ ] Content comes from the data file, newest first
- [ ] Revenue shown as percentages only
- [ ] Icons, fonts and cursors are open-source or original, and recorded

**Dependencies and security**
- [ ] New dependencies pass the dependency policy and have a complete register row
- [ ] `npm audit` shows no high or critical findings
- [ ] No secrets or `.env` committed

**Process**
- [ ] Commits follow Conventional Commits
- [ ] Review has no open blockers
- [ ] ADR written for any significant decision
- [ ] Documentation updated
