import { expect, test, type Page } from "@playwright/test";
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

  test("on a short screen the saver stays up after it starts, despite the focus and scroll events of the page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 400 });
    await page.goto("/");
    await startButton(page).click();
    await page.getByRole("button", { name: "Screen Saver" }).click();
    await expect(saver(page)).toBeVisible();
    // It is still there once frames have been drawn on it.
    await expect
      .poll(() =>
        saver(page).evaluate((canvas: HTMLCanvasElement) => {
          const data = canvas
            .getContext("2d")
            ?.getImageData(0, 0, canvas.width, canvas.height).data;
          return data !== undefined && data.some((value, index) => index % 4 !== 3 && value > 0);
        }),
      )
      .toBe(true);
    await expect(html(page)).toHaveAttribute("data-screensaver", "on");
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

  for (const dismissal of ["pointer move", "wheel"] as const) {
    test(`a ${dismissal} stops it`, async ({ page }) => {
      await page.goto("/");
      await startButton(page).click();
      await page.getByRole("button", { name: "Screen Saver" }).click();
      await expect(saver(page)).toBeVisible();
      if (dismissal === "pointer move") {
        await page.mouse.move(300, 300);
        await page.mouse.move(340, 340);
      } else {
        await page.mouse.move(400, 300);
        await page.mouse.wheel(0, 200);
      }
      await expect(saver(page)).toHaveCount(0);
      await expect(page).toHaveURL(/\/$/);
    });
  }

  /**
   * Leaves the pointer on the Projects folder and the page idle until the saver starts, so that
   * a press on that spot lands on the folder the moment the saver goes. (A pointer that moves
   * first would stop the saver by moving, and the press after it would be an ordinary one.)
   */
  async function idleOverFolder(page: Page) {
    await page.clock.install();
    await page.goto("/");
    const folder = icons(page).getByRole("link", { name: "Projects" });
    const box = await boxOf(folder);
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.clock.fastForward(95_000);
    await expect(saver(page)).toBeVisible();
    return { folder, x, y };
  }

  test("a mouse click on a folder under the saver only stops it: nothing opens or is selected", async ({
    page,
  }) => {
    const { folder, x, y } = await idleOverFolder(page);
    await page.mouse.click(x, y);
    await expect(saver(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    await expect(browserWindow(page)).toHaveCount(0);
    await expect(folder).not.toHaveAttribute("data-selected", "true");
    // The click after that is an ordinary one again.
    await folder.click();
    await expect(folder).toHaveAttribute("data-selected", "true");
  });

  test("a tap on a folder under the saver only stops it: nothing opens", async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true });
    const page = await context.newPage();
    const { x, y } = await idleOverFolder(page);
    await page.touchscreen.tap(x, y);
    await expect(saver(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    await expect(browserWindow(page)).toHaveCount(0);
    await context.close();
  });

  test("a click on the Start button under the saver does not open the menu", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    const start = await boxOf(startButton(page));
    const x = start.x + start.width / 2;
    const y = start.y + start.height / 2;
    await page.mouse.move(x, y);
    await page.clock.fastForward(95_000);
    await expect(saver(page)).toBeVisible();
    await page.mouse.click(x, y);
    await expect(saver(page)).toHaveCount(0);
    await expect(page.locator("details[data-start-menu]")).not.toHaveAttribute("open", "");
  });

  test("a click made by a script or assistive technology stops it and opens nothing", async ({
    page,
  }) => {
    await idleOverFolder(page);
    await page.evaluate(() => document.querySelector<HTMLElement>("[data-desktop-icon]")?.click());
    await expect(saver(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    await expect(browserWindow(page)).toHaveCount(0);
  });

  test("a right click stops it without a context menu reaching the page", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { menus: number }).menus = 0;
      window.addEventListener("contextmenu", () => {
        (window as unknown as { menus: number }).menus++;
      });
    });
    const { x, y } = await idleOverFolder(page);
    await page.mouse.click(x, y, { button: "right" });
    await expect(saver(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { menus: number }).menus)).toBe(0);
  });

  test("a key held down stops it once, and its repeats do not reach the page", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { repeats: number }).repeats = 0;
      window.addEventListener("keydown", (event) => {
        if (event.repeat) (window as unknown as { repeats: number }).repeats++;
      });
    });
    await page.clock.install();
    await page.goto("/");
    const folder = icons(page).getByRole("link", { name: "Projects" });
    await folder.focus();
    await page.clock.fastForward(95_000);
    await expect(saver(page)).toBeVisible();
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.up("Enter");
    await expect(saver(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { repeats: number }).repeats)).toBe(0);
    await expect(page).toHaveURL(/\/$/);
    await expect(browserWindow(page)).toHaveCount(0);
    await expect(folder).toBeFocused();
    // The next key press is an ordinary one again.
    await page.keyboard.press("Enter");
    await expect(browserWindow(page)).toBeVisible();
  });

  test("a click that follows the press that stopped it, as some browsers send, is swallowed", async ({
    page,
  }) => {
    const { folder } = await idleOverFolder(page);
    await page.mouse.down();
    await expect(saver(page)).toHaveCount(0);
    await folder.dispatchEvent("click", { detail: 1 });
    await page.mouse.up();
    await expect(page).toHaveURL(/\/$/);
    await expect(browserWindow(page)).toHaveCount(0);
    await expect(folder).not.toHaveAttribute("data-selected", "true");
  });

  test("focus that moved while the saver showed stays where it moved", async ({ page }) => {
    await page.clock.install();
    await page.goto("/projects/");
    await page.locator("#browser-address").focus();
    await page.clock.fastForward(95_000);
    await expect(saver(page)).toBeVisible();
    await page.evaluate(() => document.querySelector<HTMLElement>("#browser a.button")?.focus());
    await expect(saver(page)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Home" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Home" })).not.toBeFocused();
  });

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
    // The device starts asking for reduced motion while the saver shows.
    await page.emulateMedia({ reducedMotion: "reduce" });
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
