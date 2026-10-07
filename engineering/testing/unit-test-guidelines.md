# Unit test guidelines

A unit test checks one function or class in isolation. See the [strategy](test-strategy-and-pyramid.md) for where unit tests fit.

## Rules
- **One behaviour per test.** The name says what is expected: `sorts entries newest first`, not `test1`.
- **Arrange, act, assert.** Keep the three parts visible and separate.
- **Fake dependencies.** Constructor injection (see [SOLID](../principles/solid-principles.md)) lets you pass in fakes for the clock, `matchMedia`, animations and data readers. Do not reach for global mocks.
- **Test behaviour, not implementation.** Assert on outputs and observable effects, not on private methods or call order, unless the call is the behaviour.
- **Fast and isolated.** No network, no real timers, no file system, no shared state between tests.
- **Deterministic.** Inject the clock and any randomness. No dependence on today's date.
- **Prefer simple fakes over mock frameworks.** A small hand-written fake is easier to read.

## What to cover
- Normal cases, edge cases (empty list, one item, ties) and failure cases.
- Boundaries: year-only dates, overlapping roles, the same start date, missing optional fields.
- Rules from the charter: newest first, one industry per project, revenue shown as percentages only.
- Reduced motion: the instant animation is chosen when the preference is set.

## Example
```ts
describe("sortNewestFirst", () => {
  it("shows both overlapping roles, latest start first", () => {
    const entries = [
      entry({ title: "A", start: "2018-05" }),
      entry({ title: "B", start: "2021-12" }),
    ];

    const result = sortNewestFirst(entries);

    expect(result.map((e) => e.title)).toEqual(["B", "A"]);
  });
});
```

## Test data
- Use small builder functions (`entry({ ... })`) with sensible defaults, so each test only states what matters to it.
- Do not copy real CV content into tests. Use neutral sample values.

## Avoid
- Testing framework or library behaviour.
- Snapshot tests of large output. They hide intent and break on harmless changes.
- Several unrelated asserts in one test.
- Tests that pass when the code is deleted. Check a new test fails when the behaviour is broken.
