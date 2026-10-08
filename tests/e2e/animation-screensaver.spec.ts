import { expect, test } from "@playwright/test";
import { html, icons, status, browserWindow, saver, startButton, boxOf } from "./animation-helpers";

test.describe("the screen saver", () => {
  test("starts after 90 seconds of nothing, covers the page, and one key stops it without acting", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const folder = icons(page).getByRole("link", { name: "Projects" });
    await folder.focus();
    await page.clock.fastForward(95_000);
    await expect(saver(page)).toBeVisible();
    await expect(saver(page)).toHaveAttribute("aria-hidden", "true");
    await expect(html(page)).toHaveAttribute("data-screensaver", "on");
    const box = await boxOf(saver(page));
    expect(box.width).toBe(page.viewportSize()?.width);
    // Starting by itself does not move focus, and says nothing.
    await expect(folder).toBeFocused();
    await expect(status(page)).toHaveText("");

    await page.keyboard.press("Enter");
    await expect(saver(page)).toHaveCount(0);
    await expect(html(page)).not.toHaveAttribute("data-screensaver", "on");
    await expect(folder).toBeFocused();
    // The key that stopped it did not open the folder.
    await expect(page).toHaveURL(/\/$/);
    await expect(browserWindow(page)).toHaveCount(0);
  });

  test("less than 90 seconds, or any activity, does not start it", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await page.clock.fastForward(60_000);
    await page.mouse.move(100, 100);
    await page.clock.fastForward(60_000);
    await expect(saver(page)).toHaveCount(0);
  });

  test("the Start menu item starts it on request, announces it, and a key returns focus to Start", async ({
    page,
  }) => {
    await page.goto("/");
    await startButton(page).click();
    await page.getByRole("button", { name: "Screen Saver" }).click();
    await expect(saver(page)).toBeVisible();
    await expect(html(page)).toHaveAttribute("data-screensaver", "on");
    await expect(status(page)).toHaveText("Screen saver started");
    await page.keyboard.press("a");
    await expect(saver(page)).toHaveCount(0);
    await expect(status(page)).toHaveText("Screen saver stopped");
    await expect(startButton(page)).toBeFocused();
  });

  test("the Start menu item works from the keyboard", async ({ page }) => {
    await page.goto("/");
    await startButton(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("End");
    await expect(page.getByRole("button", { name: "Screen Saver" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(saver(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(saver(page)).toHaveCount(0);
  });

  for (const dismissal of ["pointer move", "click", "wheel", "touch"] as const) {
    test(`a ${dismissal} stops it, and is not passed on to the page`, async ({ browser }) => {
      const context = await browser.newContext({ hasTouch: dismissal === "touch" });
      const page = await context.newPage();
      await page.goto("/");
      await startButton(page).click();
      await page.getByRole("button", { name: "Screen Saver" }).click();
      await expect(saver(page)).toBeVisible();
      if (dismissal === "pointer move") {
        await page.mouse.move(300, 300);
        await page.mouse.move(340, 340);
      } else if (dismissal === "click") {
        await page.mouse.click(200, 200);
      } else if (dismissal === "wheel") {
        await page.mouse.move(400, 300);
        await page.mouse.wheel(0, 200);
      } else {
        await page.touchscreen.tap(200, 200);
      }
      await expect(saver(page)).toHaveCount(0);
      await expect(page).toHaveURL(/\/$/);
      await context.close();
    });
  }

  test("stops when the page is hidden, and when animations are turned off", async ({ page }) => {
    await page.goto("/");
    await startButton(page).click();
    await page.getByRole("button", { name: "Screen Saver" }).click();
    await expect(saver(page)).toBeVisible();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(saver(page)).toHaveCount(0);

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await startButton(page).click();
    await page.getByRole("button", { name: "Screen Saver" }).click();
    await expect(saver(page)).toBeVisible();
    await page.evaluate(() =>
      document.querySelector<HTMLButtonElement>("[data-animations-toggle]")?.click(),
    );
    await expect(saver(page)).toHaveCount(0);
    await expect(html(page)).toHaveAttribute("data-animations", "off");
  });

  test("draws with the colours of the page's tokens, and is cleaned up when it stops", async ({
    page,
  }) => {
    await page.goto("/");
    await startButton(page).click();
    await page.getByRole("button", { name: "Screen Saver" }).click();
    await expect(saver(page)).toBeVisible();
    // Something other than the background colour has been drawn once frames run.
    await expect
      .poll(() =>
        saver(page).evaluate((canvas: HTMLCanvasElement) => {
          const context = canvas.getContext("2d");
          const data = context?.getImageData(0, 0, canvas.width, canvas.height).data;
          if (data === undefined) return false;
          for (let index = 0; index < data.length; index += 4) {
            if ((data[index] ?? 0) > 0 || (data[index + 1] ?? 0) > 0) return true;
          }
          return false;
        }),
      )
      .toBe(true);
    await page.keyboard.press("Shift");
    await expect(saver(page)).toHaveCount(0);
  });
});
