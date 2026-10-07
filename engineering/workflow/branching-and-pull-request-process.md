# Branching and pull requests

## Branches
- `main` is always deployable. Pushes go to GitHub Pages, so nothing is pushed to `main` directly.
- Work on a short-lived branch from `main`. Name it `<type>/<short-description>`, using the same types as [conventional commits](commit-message-conventions.md). For example `feat/window-manager`, `fix/date-sorting`.
- Keep branches small and short-lived. Rebase or merge `main` in often.

## Pull requests
- Every change goes through a pull request.
- The title follows conventional commits, since it becomes the squash commit message.
- The description covers:
  - **What and why:** the problem and the approach.
  - **How to verify:** the commands or steps to see it work.
  - **Notes:** trade-offs, follow-ups, and any hard decision the owner needs to make.
  - A checklist from the [definition of done](definition-of-done-checklist.md).
- Keep pull requests focused. Split work that does more than one thing.
- Include screenshots or a short recording for visual changes. Check them at phone width and with reduced motion.

## Review
- Each pull request is reviewed before merge. The reviewer is currently the Claude Opus review agent (see [code-review-checklist.md](code-review-checklist.md)).
- Findings are addressed by pushing new commits. Do not force-push over a review in progress.
- The owner makes the final call on merging, and on any hard decision raised in the pull request.

## Merging
- All checks must pass: build, lint, type check, unit, integration and end-to-end tests, `npm audit`, commit message lint.
- Use **squash merge** with a conventional commit title, so history on `main` reads as a clean list of changes.
- Delete the branch after merge.

## Hard decisions
Stop and ask the owner before:
- changing scope, requirements or the charter,
- adding or swapping a major dependency or changing the stack,
- publishing any personal data, or anything the owner has not cleared,
- anything with a cost or a licence implication.

Put the question and the options in the pull request or ask directly. Do not decide silently.
