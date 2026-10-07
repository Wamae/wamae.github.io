# Engineering guide

How code is written, tested, reviewed and delivered in this repository. These documents apply to every change, whether it is written by a person or by Claude.

The project's scope, constraints and requirements live in [`product/project_charter.md`](../product/project_charter.md). Where this guide and the charter disagree, the charter wins and this guide gets fixed.

## Contents

| Area | Document | Covers |
|---|---|---|
| Principles | [principles/solid-principles.md](principles/solid-principles.md) | The five SOLID principles with examples for this codebase |
| Principles | [principles/composition-over-inheritance.md](principles/composition-over-inheritance.md) | Why we compose, and the rare cases where inheritance is allowed |
| Principles | [principles/coding-style-guide.md](principles/coding-style-guide.md) | Naming, file layout, configuration, comments, error handling |
| Workflow | [workflow/commit-message-conventions.md](workflow/commit-message-conventions.md) | Conventional Commits format and rules |
| Workflow | [workflow/branching-and-pull-request-process.md](workflow/branching-and-pull-request-process.md) | Branches, pull requests, merging, hard decisions |
| Workflow | [workflow/code-review-checklist.md](workflow/code-review-checklist.md) | What reviewers (including the Claude Opus review agent) check |
| Workflow | [workflow/definition-of-done-checklist.md](workflow/definition-of-done-checklist.md) | The checklist a change must meet before merge |
| Testing | [testing/test-strategy-and-pyramid.md](testing/test-strategy-and-pyramid.md) | The test pyramid, tooling, coverage and CI gates |
| Testing | [testing/unit-test-guidelines.md](testing/unit-test-guidelines.md) | Unit test rules |
| Testing | [testing/integration-test-guidelines.md](testing/integration-test-guidelines.md) | Integration test rules |
| Testing | [testing/end-to-end-test-guidelines.md](testing/end-to-end-test-guidelines.md) | End-to-end test rules |
| Quality | [quality/accessibility-and-reduced-motion-requirements.md](quality/accessibility-and-reduced-motion-requirements.md) | WCAG 2.2 AA, keyboard use and reduced motion |
| Quality | [quality/performance-budget.md](quality/performance-budget.md) | Performance budgets |
| Dependencies | [dependencies/dependency-selection-policy.md](dependencies/dependency-selection-policy.md) | The T1 to T4 sustainability check |
| Dependencies | [dependencies/dependency-register.md](dependencies/dependency-register.md) | The register of every dependency, with evidence |
| Architecture | [architecture/adr-writing-guide.md](architecture/adr-writing-guide.md) | How to write an architecture decision record (ADR) |
| Architecture | [architecture/adr/0000-adr-template.md](architecture/adr/0000-adr-template.md) | ADR template |

## The short version

1. Design with SOLID. Compose behaviour from small parts. Do not build inheritance hierarchies.
2. Write a test first or alongside the code. Unit, integration and end-to-end tests all have a place.
3. Commit with Conventional Commits, in small steps.
4. Work on a branch, open a pull request, get it reviewed, and meet the definition of done.
5. Record significant decisions as ADRs.
6. When something is a hard decision, ask the owner before going ahead.
