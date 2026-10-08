import { expect, test } from "@playwright/test";
import {
  html,
  h1,
  icons,
  taskbar,
  toggle,
  status,
  saver,
  startButton,
  record,
  outlines,
  busyLog,
  boxOf,
} from "./animation-helpers";

test.describe("the Animations button and reduced motion", () => {
  test("is a pressed button with the name Animations, at least 24px high", async ({ page }) => {
    await page.goto("/");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    const box = await boxOf(toggle(page));
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  });

  test("turning animations off is immediate, announced, remembered and reversible", async ({
    page,
  }) => {
    await record(page);
    await page.goto("/");
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute("data-animations", "off");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
    await expect(status(page)).toHaveText("Animations off");
    expect(await page.evaluate(() => localStorage.getItem("desktop-animations"))).toBe("off");

    await icons(page).getByRole("link", { name: "Projects" }).dblclick();
    await expect(h1(page)).toHaveText("Projects");
    expect(await outlines(page)).toEqual([]);

    await page.reload();
    await expect(html(page)).toHaveAttribute("data-animations", "off");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");

    await toggle(page).click();
    await expect(html(page)).toHaveAttribute("data-animations", "on");
    await expect(status(page)).toHaveText("Animations on");
    expect(await page.evaluate(() => localStorage.getItem("desktop-animations"))).toBe("on");
    await page.getByRole("button", { name: "Minimize" }).click();
    await expect.poll(async () => (await outlines(page)).length).toBe(1);
  });

  test("ignores a saved value that it did not write", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("desktop-animations", "maybe"));
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-animations", "on");
  });

  test("works when storage is blocked", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    });
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-animations", "on");
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute("data-animations", "off");
  });

  test.describe("when the device asks for reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("everything is off, the button says why, and no outline is ever drawn", async ({
      page,
    }) => {
      await record(page);
      await page.goto("/");
      await expect(html(page)).toHaveAttribute("data-animations", "off");
      const button = taskbar(page).getByRole("button", {
        name: "Animations off: your device asks for reduced motion",
      });
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute("aria-pressed", "false");

      await startButton(page).click();
      await expect(
        page
          .getByRole("navigation", { name: "Start menu" })
          .getByRole("link", { name: "Projects" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Screen Saver" })).toHaveCount(0);
      await page
        .getByRole("navigation", { name: "Start menu" })
        .getByRole("link", { name: "Projects" })
        .click();
      await expect(h1(page)).toHaveText("Projects");
      await page.getByRole("button", { name: "Minimize" }).click();
      await taskbar(page).getByRole("button", { name: "Projects" }).click();
      await page.getByRole("button", { name: "Maximize" }).click();
      await page.getByRole("button", { name: "Close" }).click();
      await expect(h1(page)).toHaveText("E2E Test Owner");
      expect(await outlines(page)).toEqual([]);
      await expect(html(page)).not.toHaveAttribute("data-animating", "zoom");
    });

    test("the screen saver never starts by itself", async ({ page }) => {
      await page.clock.install();
      await page.goto("/");
      await page.clock.fastForward(300_000);
      await expect(saver(page)).toHaveCount(0);
      await expect(html(page)).not.toHaveAttribute("data-screensaver", "on");
    });

    test("the busy cursor shows only while loading", async ({ page }) => {
      await record(page);
      await page.goto("/");
      await icons(page).getByRole("link", { name: "About Me" }).dblclick();
      await expect(h1(page)).toHaveText("About Me");
      await expect(html(page)).not.toHaveAttribute("data-busy", "true");
      const log = await busyLog(page);
      for (const entry of log) {
        expect((entry.off ?? entry.on) - entry.on).toBeLessThan(250);
      }
    });

    test("the Program Manager groups do not animate", async ({ page }) => {
      await page.goto("/program-manager/");
      await expect(page.locator("#program-manager .group").first()).toHaveCSS(
        "animation-name",
        "none",
      );
    });
  });
});

test("the whole animation flow logs no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await icons(page).getByRole("link", { name: "Projects" }).dblclick();
  await page.getByRole("button", { name: "Minimize" }).click();
  await taskbar(page).getByRole("button", { name: "Projects" }).click();
  await page.getByRole("button", { name: "Maximize" }).click();
  await page.getByRole("button", { name: "Restore" }).click();
  await toggle(page).click();
  await toggle(page).click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(h1(page)).toHaveText("E2E Test Owner");
  expect(errors).toEqual([]);
});

test("on a phone the Animations button is reachable, large enough and nothing scrolls sideways", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/projects/");
  await expect(toggle(page)).toBeInViewport();
  const box = await boxOf(toggle(page));
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await toggle(page).tap();
  await expect(html(page)).toHaveAttribute("data-animations", "off");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await context.close();
});

test("without JavaScript there is no Animations button, no Screen Saver item and no animation", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/program-manager/");
  await expect(page.getByRole("button", { name: "Animations" })).toHaveCount(0);
  await startButton(page).click();
  await expect(page.getByRole("button", { name: "Screen Saver" })).toHaveCount(0);
  await expect(page.locator("#program-manager .group").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator("#program-manager .group")).toHaveCount(3);
  await context.close();
});
