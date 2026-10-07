# Test strategy and pyramid

Three levels of automated test, each with a different job. Most tests are unit tests, fewer are integration tests, and the fewest are end-to-end tests.

```
        /\        End-to-end   few, slow, real browser, key user journeys
       /  \
      /----\      Integration  some, parts working together
     /      \
    /--------\    Unit         many, fast, one piece in isolation
```

| Level | Tests | Real browser | Speed | Guide |
|---|---|---|---|---|
| Unit | One function or class, with its dependencies faked | No (a fake DOM only if needed) | Milliseconds | [unit-test-guidelines.md](unit-test-guidelines.md) |
| Integration | Several real parts together: data file, schema, sorting and rendering; window manager with animation | Sometimes (a DOM environment) | Under a second | [integration-test-guidelines.md](integration-test-guidelines.md) |
| End-to-end | The built site, as a visitor sees it | Yes | Seconds | [end-to-end-test-guidelines.md](end-to-end-test-guidelines.md) |

## What each level protects
- **Unit:** logic. Sorting newest first, overlap handling, percentage formatting, animation selection, configuration validation.
- **Integration:** seams. The CV data file passes the schema and renders the right entries in the right order. The window manager, focus and animation strategies work together.
- **End-to-end:** journeys. Open the site, open a window with the keyboard, see experience and projects, read content with JavaScript off, honour reduced motion.

## Tooling (proposed, to be confirmed by ADR)
- **Unit and integration:** Vitest.
- **End-to-end:** Playwright, run against the built site.
- **Accessibility checks:** axe, run inside the end-to-end tests.
- Each tool must pass the [dependency selection policy](../dependencies/dependency-selection-policy.md) before it is adopted.

## Working rules
- Write the test first or alongside the code. A bug fix starts with a test that fails.
- Put each test at the lowest level that can catch the problem.
- Tests are independent, repeatable and have no dependence on order, clock time or network.
- Fakes and test data live next to the feature they serve. Shared helpers go in one test-support folder.
- A flaky test is a bug. Fix it or delete it. Never retry until it passes.

## Layout
```
src/<feature>/<name>.ts
src/<feature>/<name>.test.ts      unit tests, next to the code
tests/integration/                integration tests
tests/e2e/                        end-to-end tests
tests/support/                    shared fakes, builders, helpers
```

## CI gates (a pull request cannot merge unless all pass)
1. Type check and lint
2. Unit tests
3. Integration tests
4. Build, then end-to-end tests against the built site
5. Accessibility checks and the performance budget
6. `npm audit` with no high or critical findings

## Coverage
- Coverage is a signal, not a goal. Start with a floor of 80% on lines for logic code (not for generated or purely visual code), and raise it if it holds.
- Reviewers look at what is tested, not the percentage alone.
