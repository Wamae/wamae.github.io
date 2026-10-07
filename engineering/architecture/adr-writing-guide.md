# Writing architecture decision records (ADRs)

An ADR records one significant decision, why it was made and what it costs. It lets a future reader (or Claude in a new session) understand why the code looks the way it does.

## When to write one
- Choosing or replacing a framework, tool or major dependency.
- A pattern that affects many files (for example how windows and animations are structured).
- Anything that is a hard decision for the owner (scope, licensing, publishing data).
- A deliberate exception to this guide, such as using inheritance because a platform requires it.

## How
1. Copy [adr/0000-adr-template.md](adr/0000-adr-template.md) to `adr/NNNN-short-title.md`, using the next number.
2. Fill it in. Keep it to one page.
3. Set the status to `proposed`, and link it from the pull request.
4. When the owner approves, set it to `accepted`.
5. Never edit an accepted ADR to change the decision. Write a new ADR that supersedes it, and mark the old one `superseded by NNNN`.

## Rules
- State the options that were really considered, including the cost of each, and why one won.
- Link to evidence (versions, dates checked, benchmarks, the dependency register row).
- Be honest about the downsides of the choice.
