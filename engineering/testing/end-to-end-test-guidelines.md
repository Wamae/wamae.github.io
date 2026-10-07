# End-to-end test guidelines

An end-to-end (E2E) test drives the **built** site in a real browser, as a visitor would. See the [strategy](test-strategy-and-pyramid.md) for where these fit.

## Rules
- Test against the production build served locally, not the dev server. That is what GitHub Pages serves.
- Cover journeys, not every detail. Keep the suite small, because these tests are slow.
- Find elements the way a user does: by role, label and visible text. Avoid CSS selectors tied to layout. Add a `data-testid` only when there is no accessible handle.
- No fixed waits. Wait for visible results, using the tool's auto-waiting.
- Each test is independent and can run on its own, in any order.
- Run in more than one browser engine in CI (Chromium, Firefox, WebKit) and at phone and desktop widths.
- Keep screenshots and traces from failures as CI artefacts.

## Journeys to cover
1. **First load:** the desktop shell appears and the site shows the owner's name from configuration.
2. **Open a window by mouse and by keyboard:** Enter or Space on an icon opens it, focus moves into the window, Escape or the close control returns focus to the icon.
3. **Experience:** the work experience window lists roles newest first, with overlapping roles both visible.
4. **Projects:** the projects window lists projects newest first, each with one industry.
5. **No JavaScript:** with JavaScript disabled, all experience and project content is still readable.
6. **Reduced motion:** with `prefers-reduced-motion: reduce`, windows open and close without animation, and the screensaver does not start by itself.
7. **Animation controls:** the pause or disable control stops animations.
8. **Phone width:** the layout switches to stacked panels and nothing scrolls sideways.
9. **Accessibility:** automated axe checks on each main view report no serious or critical issues.

## Example
```ts
test("opens the experience window with the keyboard", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Experience" }).press("Enter");

  await expect(page.getByRole("dialog", { name: "Experience" })).toBeVisible();
});
```

## Avoid
- Testing logic that a unit test covers faster.
- Asserting on animation frames or timing. Assert on the end state.
- Tests that rely on real third-party sites or the network.
- Retrying a test until it goes green.
