import { expect, test, type Page } from "@playwright/test";
import { h1, toggle, startButton } from "./animation-helpers";

test.describe("the Program Manager cascade", () => {
  const delays = (page: Page) =>
    page
      .locator("#program-manager .group")
      .evaluateAll((groups) => groups.map((group) => getComputedStyle(group).animationDelay));
  const layout = (page: Page) =>
    page.locator("#program-manager .group").evaluateAll((groups) =>
      groups.map((group) => {
        const { x, y, width, height } = group.getBoundingClientRect();
        return [x, y, width, height].map(Math.round);
      }),
    );
  const settled = (page: Page) =>
    page.evaluate(() =>
      Promise.all(document.getAnimations().map((animation) => animation.finished)),
    );

  test("the group windows appear one after another, and end where the static layout is", async ({
    page,
  }) => {
    await page.goto("/program-manager/");
    expect(await delays(page)).toEqual(["0s", "0.09s", "0.18s"]);
    await expect(page.locator("#program-manager .group").first()).not.toHaveCSS(
      "animation-name",
      "none",
    );
    await settled(page);
    const withAnimations = await layout(page);
    await toggle(page).click();
    await expect(page.locator("#program-manager .group").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    expect(await layout(page)).toEqual(withAnimations);
    await expect(page.locator("#program-manager .group").first()).toHaveCSS("transform", "none");
  });

  test("it plays after a swap from the Start menu too", async ({ page }) => {
    await page.goto("/");
    await startButton(page).click();
    await page
      .getByRole("navigation", { name: "Start menu" })
      .getByRole("link", { name: "Program Manager" })
      .click();
    await expect(h1(page)).toHaveText("Program Manager");
    expect(await delays(page)).toEqual(["0s", "0.09s", "0.18s"]);
  });
});
