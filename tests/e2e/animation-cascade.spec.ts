import { expect, test, type Page } from "@playwright/test";
import { h1, html, toggle, startButton } from "./animation-helpers";

interface Mark {
  delay: string;
  name: string;
}

const groups = (page: Page) => page.locator("#program-manager .group");

/** Records each group window as it is marked for the cascade, with the animation it was given. */
async function recordMarks(page: Page) {
  await page.addInitScript(() => {
    const marks: { delay: string; name: string }[] = [];
    Object.assign(window, { marks });
    new MutationObserver((records) => {
      for (const change of records) {
        const target = change.target;
        if (
          target instanceof HTMLElement &&
          change.attributeName === "data-cascade" &&
          target.hasAttribute("data-cascade")
        ) {
          const style = getComputedStyle(target);
          marks.push({ delay: style.animationDelay, name: style.animationName });
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-cascade"] });
  });
}
const marks = (page: Page) => page.evaluate(() => (window as unknown as { marks: Mark[] }).marks);

const layout = (page: Page) =>
  groups(page).evaluateAll((items) =>
    items.map((item) => {
      const { x, y, width, height } = item.getBoundingClientRect();
      return [x, y, width, height].map(Math.round);
    }),
  );

async function openFromStart(page: Page) {
  await page.goto("/");
  await startButton(page).click();
  await page
    .getByRole("navigation", { name: "Start menu" })
    .getByRole("link", { name: "Program Manager" })
    .click();
  await expect(h1(page)).toHaveText("Program Manager");
}

const cascadeEnded = (page: Page) =>
  expect(page.locator("#program-manager [data-cascade]")).toHaveCount(0);

test.describe("the Program Manager cascade", () => {
  test("when opened from the Start menu the group windows appear one after another", async ({
    page,
  }) => {
    await recordMarks(page);
    await openFromStart(page);
    await expect.poll(async () => (await marks(page)).length).toBe(3);
    expect((await marks(page)).map((mark) => mark.delay)).toEqual(["0s", "0.09s", "0.18s"]);
    for (const mark of await marks(page)) expect(mark.name).not.toBe("none");
    await cascadeEnded(page);
  });

  test("it ends in the same layout as the page loaded straight", async ({ browser }) => {
    const swapped = await (await browser.newContext()).newPage();
    await openFromStart(swapped);
    await cascadeEnded(swapped);
    const afterCascade = await layout(swapped);
    await expect(groups(swapped).first()).toHaveCSS("transform", "none");
    await expect(groups(swapped).first()).toHaveCSS("opacity", "1");

    const direct = await (await browser.newContext()).newPage();
    await direct.goto("/program-manager/");
    expect(await layout(direct)).toEqual(afterCascade);
    await swapped.context().close();
    await direct.context().close();
  });

  test("a page loaded straight is never hidden before the script runs, and never cascades", async ({
    page,
  }) => {
    await recordMarks(page);
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/_astro\/.*\.js$/, async (route) => {
      await held;
      await route.continue().catch(() => undefined);
    });
    await page.goto("/program-manager/", { waitUntil: "commit" });
    await expect(groups(page)).toHaveCount(3);
    for (const item of await groups(page).all()) {
      await expect(item).toHaveCSS("opacity", "1");
      await expect(item).toHaveCSS("animation-name", "none");
    }
    await expect(html(page)).not.toHaveClass(/js/);
    release();
    await expect(html(page)).toHaveClass(/js/);
    for (const item of await groups(page).all()) {
      await expect(item).toHaveCSS("opacity", "1");
      await expect(item).toHaveCSS("animation-name", "none");
    }
    expect(await marks(page)).toEqual([]);
  });

  test("switching animations off and on again does not play it again", async ({ page }) => {
    await recordMarks(page);
    await openFromStart(page);
    await expect.poll(async () => (await marks(page)).length).toBe(3);
    await cascadeEnded(page);
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute("data-animations", "off");
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute("data-animations", "on");
    await expect(groups(page).first()).toHaveCSS("animation-name", "none");
    expect(await marks(page)).toHaveLength(3);
  });

  test("it does not play with animations switched off", async ({ page }) => {
    await recordMarks(page);
    await page.goto("/");
    await toggle(page).click();
    await startButton(page).click();
    await page
      .getByRole("navigation", { name: "Start menu" })
      .getByRole("link", { name: "Program Manager" })
      .click();
    await expect(h1(page)).toHaveText("Program Manager");
    await expect(groups(page).first()).toHaveCSS("animation-name", "none");
    expect(await marks(page)).toEqual([]);
  });

  test.describe("when the device asks for reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("it never plays", async ({ page }) => {
      await recordMarks(page);
      await openFromStart(page);
      await expect(groups(page).first()).toHaveCSS("animation-name", "none");
      expect(await marks(page)).toEqual([]);
    });
  });
});

test("without JavaScript the group windows are plainly there", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/program-manager/");
  await expect(page.locator("#program-manager .group")).toHaveCount(3);
  await expect(page.locator("#program-manager .group").first()).toHaveCSS("animation-name", "none");
  await context.close();
});
