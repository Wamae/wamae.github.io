# Integration test guidelines

An integration test checks that several real parts work together. See the [strategy](test-strategy-and-pyramid.md) for where these fit.

## Rules
- Use real implementations of the parts under test. Fake only what is outside the system: the network, the real clock, the real browser.
- Test across one seam at a time (for example data file to schema to sorted list to rendered markup).
- Keep each test focused on one scenario. Prefer a few meaningful scenarios over many near-duplicates.
- Keep them fast. Use a DOM environment such as jsdom or happy-dom, not a full browser. A real browser belongs in [end-to-end tests](end-to-end-test-guidelines.md).
- Tests are independent. Build all the data each test needs, and reset state in between.

## What to cover in this project
- **Content pipeline:** the real CV data file passes the schema. A bad entry fails the check with a clear message. Entries render newest first, overlapping roles both appear, each project shows exactly one industry, and revenue appears as percentages only.
- **Configuration:** the environment file is read and validated. A missing name or email fails the build with a clear message. `.env.example` contains every key that is read.
- **Window system:** the window manager, focus handling and an animation strategy work together. Opening a window moves focus. Closing returns focus to the icon. The instant animation is used when reduced motion is on.
- **Build output:** the generated pages contain the expected content without JavaScript.

## Example
```ts
it("renders experience from the data file, newest first", () => {
  const entries = loadEntries(testDataFile);     // real loader and schema
  const html = renderExperience(entries);        // real renderer

  expect(titlesIn(html)).toEqual(["Latest role", "Earlier role"]);
});
```

## Data
- Use a small, purpose-made data file under `tests/support/` for most scenarios.
- One test checks the real production data file, so a bad CV edit fails fast.

## Avoid
- Fakes everywhere. That turns the test into a unit test with extra steps.
- Testing the full page in a real browser. That belongs in an end-to-end test.
- Hidden dependencies between tests.
