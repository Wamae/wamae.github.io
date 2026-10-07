# Code review

Who reviews: currently a **Claude Opus review agent**, standing in for Gemini (see section 8 of the charter). The author, Claude, does not approve its own work. The reviewer gets the diff and these standards, and has no knowledge of the author's reasoning beyond the pull request description.

## What the reviewer checks

**Correctness**
- Does the change do what the pull request says? Look for logic errors, edge cases, off-by-one errors and unhandled failures.
- Is chronological ordering (newest first, overlaps shown) correct for the sample and real data?

**Design**
- [SOLID](../principles/solid-principles.md) respected. [Composition over inheritance](../principles/composition-over-inheritance.md) respected. No new `extends` without a documented exception.
- Dependencies injected, side effects at the edges, small public surfaces.
- No duplicate logic that should be shared, and no premature abstraction.

**Tests**
- New behaviour has tests at the right level (see [testing strategy](../testing/test-strategy-and-pyramid.md)).
- Tests check behaviour, not implementation details. They would fail if the behaviour broke.
- Bug fixes include a test that fails without the fix.

**Quality**
- Accessibility, reduced motion and performance rules are met (see [quality](../quality/accessibility-and-reduced-motion-requirements.md)).
- Content works without JavaScript.
- No Microsoft assets. Icons and fonts are open-source and recorded.

**Security and privacy**
- No secrets or `.env` files committed. Name and email come from configuration.
- No currency values for revenue (percentages only), and no unapproved personal data.
- New dependencies have a complete row in the dependency register and pass `npm audit`.

**Process**
- Commits follow [conventional commits](commit-message-conventions.md). The pull request meets the [definition of done](definition-of-done-checklist.md).

## How the reviewer reports
- Findings are listed by severity: **blocker** (must fix), **should fix**, **suggestion**.
- Each finding names the file and line, states the problem, and shows the failing scenario or the principle it breaks.
- Do not report style that a formatter or linter already enforces.
- Say plainly when a check found nothing. Do not pad the review.

## After the review
- The author addresses every blocker and either fixes or explains each other finding.
- The reviewer checks the fixes. Merging waits for no open blockers.
- Anything that needs the owner's decision goes to the owner, not into the code.
