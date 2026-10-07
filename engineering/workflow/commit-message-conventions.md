# Conventional Commits

Every commit message follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

## Format
```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

- **Description:** imperative mood, lower case, no full stop, 72 characters or fewer. ("add zoom outline animation", not "Added...").
- **Body:** explain why the change was made and any trade-offs. Wrap at about 72 characters. The commit linter warns (does not fail) above 100 characters. Dependabot bodies are exempt in practice.
- **Footer:** `BREAKING CHANGE: ...`, issue references, and the required co-author line (see below).

## Types

| Type | Use for |
|---|---|
| `feat` | A new feature the visitor can see or use |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting only, no code meaning change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `build` | Build system or dependency changes |
| `ci` | CI and deployment workflow changes |
| `chore` | Maintenance that fits nowhere else |
| `revert` | Reverts an earlier commit |

## Scopes
Use the feature folder name when it helps: `windows`, `animation`, `content`, `theme`, `deploy`, `a11y`, `deps`.

## Rules
- One logical change per commit. If the description needs "and", consider two commits.
- Each commit leaves the build and tests passing.
- A breaking change uses `!` after the type or scope (`feat(content)!: ...`) and a `BREAKING CHANGE:` footer.
- Do not mix formatting changes with behaviour changes.
- Commits made by Claude end with the attribution line given for the session, for example `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Never include secrets or personal data in a message.

## Examples
```
feat(animation): add zoom outline for window open

Animate a wireframe rectangle between the icon and the window using
stepped easing, to match the NT 3.1 look.
```
```
fix(content): sort overlapping roles by end date

Roles with the same start date appeared in file order.
```
```
build(deps)!: upgrade to Node 26

BREAKING CHANGE: CI and local development require Node 26 or later.
```

## Enforcement
- A commit message linter runs in CI on every commit in a pull request. The tool is chosen through an ADR and must pass the [dependency policy](../dependencies/dependency-selection-policy.md).
- Releases and the changelog can be generated from commit types.
