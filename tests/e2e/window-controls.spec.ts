import { expect, test, type Page } from "@playwright/test";
import { e2eOwnerName } from "../../playwright.config";

const site = "https://wamae.github.io";
const h1 = (page: Page) => page.getByRole("heading", { level: 1 });
const addressBar = (page: Page) => page.getByRole("textbox", { name: "Address" });
const status = (page: Page) => page.locator("[data-page-status]");
const icons = (page: Page) => page.getByRole("navigation", { name: "Desktop folders" });
const minimize = (page: Page) => page.getByRole("button", { name: "Minimize" });
const maximize = (page: Page) => page.getByRole("button", { name: "Maximize" });
const close = (page: Page) => page.getByRole("button", { name: "Close" });
const taskbar = (page: Page) => page.getByRole("region", { name: "Taskbar" });
const taskButton = (page: Page, name: string) => taskbar(page).getByRole("button", { name });
const browserWindow = (page: Page) => page.locator("#browser");

async function openFromStart(page: Page, name: string) {
  await page.locator("summary", { hasText: "Start" }).click();
  await page.getByRole("navigation", { name: "Start menu" }).getByRole("link", { name }).click();
}

test("Close returns to the desktop, and Back reopens the section", async ({ page }) => {
  await page.goto("/");
  await icons(page).getByRole("link", { name: "About Me" }).dblclick();
  await icons(page).getByRole("link", { name: "Projects" }).dblclick();
  await expect(h1(page)).toHaveText("Projects");

  await close(page).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(h1(page)).toHaveText(e2eOwnerName);
  await expect(page).toHaveTitle(e2eOwnerName);
  await expect(browserWindow(page)).toHaveCount(0);
  await expect(taskbar(page).locator(".task-button:visible")).toHaveCount(0);
  await expect(status(page)).toHaveText("Projects closed");
  await expect(icons(page).getByRole("link", { name: "Projects" })).toBeFocused();

  await page.goBack();
  await expect(h1(page)).toHaveText("Projects");
  await expect(addressBar(page)).toHaveValue(`${site}/projects/`);
  await expect(page.getByRole("button", { name: "Back" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Forward" })).toBeEnabled();
  await expect(taskButton(page, "Projects")).toHaveAttribute("aria-pressed", "true");

  await page.goForward();
  await expect(h1(page)).toHaveText(e2eOwnerName);
});

test("Close on a deep link works and keeps Back and Forward right", async ({ page }) => {
  await page.goto("/contact/");
  await close(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(h1(page)).toHaveText(e2eOwnerName);
  await page.goBack();
  await expect(h1(page)).toHaveText("Contact");
  await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Forward" })).toBeEnabled();
});

test("Close from a program with no desktop icon puts focus on the page", async ({ page }) => {
  await page.goto("/program-manager/");
  await close(page).click();
  await expect(h1(page)).toHaveText(e2eOwnerName);
  await expect(page.locator("#main")).toBeFocused();
});

test("Close is the same document: no full page load", async ({ page }) => {
  await page.goto("/projects/");
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "same-document";
  });
  await close(page).click();
  await expect(h1(page)).toHaveText(e2eOwnerName);
  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe(
    "same-document",
  );
});

test("Minimize hides the window, keeps the taskbar button and changes neither URL nor history", async ({
  page,
}) => {
  await page.goto("/projects/");
  const entries = await page.evaluate(() => history.length);

  await minimize(page).click();

  await expect(browserWindow(page)).toBeHidden();
  await expect(h1(page)).toHaveCount(0);
  const button = taskButton(page, "Projects");
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button).toBeFocused();
  await expect(status(page)).toHaveText("Projects minimized");
  await expect(page).toHaveURL(/\/projects\/$/);
  expect(await page.evaluate(() => history.length)).toBe(entries);

  await button.click();

  await expect(browserWindow(page)).toBeVisible();
  await expect(h1(page)).toHaveText("Projects");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(status(page)).toHaveText("Projects restored");
  await expect(page.locator("#main")).toBeFocused();
  await expect(addressBar(page)).toHaveValue(`${site}/projects/`);
  await expect(page).toHaveURL(/\/projects\/$/);
  expect(await page.evaluate(() => history.length)).toBe(entries);
});

test("the window button minimizes an active window and restores a minimized one", async ({
  page,
}) => {
  await page.goto("/about/");
  const button = taskButton(page, "About Me");
  await button.click();
  await expect(browserWindow(page)).toBeHidden();
  await button.click();
  await expect(browserWindow(page)).toBeVisible();
  await button.click();
  await expect(browserWindow(page)).toBeHidden();
  await expect(status(page)).toHaveText("About Me minimized");
});

test("keyboard: Enter and Space work on Minimize, the window button and Close", async ({
  page,
}) => {
  await page.goto("/projects/");
  await minimize(page).focus();
  await page.keyboard.press("Enter");
  await expect(browserWindow(page)).toBeHidden();
  await expect(taskButton(page, "Projects")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(browserWindow(page)).toBeVisible();
  await expect(page.locator("#main")).toBeFocused();

  await minimize(page).focus();
  await page.keyboard.press("Space");
  await expect(browserWindow(page)).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(browserWindow(page)).toBeVisible();

  await close(page).focus();
  await page.keyboard.press("Space");
  await expect(h1(page)).toHaveText(e2eOwnerName);
  await expect(icons(page).getByRole("link", { name: "Projects" })).toBeFocused();

  await page.goBack();
  await close(page).focus();
  await page.keyboard.press("Enter");
  await expect(h1(page)).toHaveText(e2eOwnerName);
});

test("the controls are reached with the Tab key from the page start, with a dotted focus ring", async ({
  page,
}) => {
  await page.goto("/projects/");
  const tabUntil = async (reached: () => Promise<boolean>) => {
    for (let presses = 0; presses < 30; presses++) {
      await page.keyboard.press("Tab");
      if (await reached()) return;
    }
    throw new Error("Tab never reached the control");
  };
  await tabUntil(() => minimize(page).evaluate((el) => el === document.activeElement));
  await expect(minimize(page)).toBeFocused();
  await expect(minimize(page)).toHaveCSS("outline-style", "dotted");
  await page.keyboard.press("Tab");
  await expect(maximize(page)).toBeFocused();
  await expect(maximize(page)).toHaveCSS("outline-style", "dotted");
  await page.keyboard.press("Tab");
  await expect(close(page)).toBeFocused();
  await expect(close(page)).toHaveCSS("outline-style", "dotted");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(minimize(page)).toBeFocused();
});

test("opening another section from the Start menu while minimized restores the window", async ({
  page,
}) => {
  await page.goto("/projects/");
  await minimize(page).click();
  await openFromStart(page, "Contact");
  await expect(browserWindow(page)).toBeVisible();
  await expect(h1(page)).toHaveText("Contact");
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(taskButton(page, "Contact")).toHaveAttribute("aria-pressed", "true");
  await expect(taskbar(page).locator(".task-button:visible")).toHaveCount(1);
  await minimize(page).click();
  await expect(browserWindow(page)).toBeHidden();
});

test("opening the same section from its desktop icon while minimized restores it", async ({
  page,
}) => {
  await page.goto("/projects/");
  await minimize(page).click();
  await icons(page).getByRole("link", { name: "Projects" }).dblclick();
  await expect(browserWindow(page)).toBeVisible();
  await expect(h1(page)).toHaveText("Projects");
  await expect(taskButton(page, "Projects")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#main")).toBeFocused();
});

test("Show Desktop while minimized closes the window", async ({ page }) => {
  await page.goto("/projects/");
  await minimize(page).click();
  await openFromStart(page, "Show Desktop");
  await expect(h1(page)).toHaveText(e2eOwnerName);
  await expect(browserWindow(page)).toHaveCount(0);
  await expect(taskbar(page).locator(".task-button:visible")).toHaveCount(0);
  await expect(status(page)).toHaveText("Projects closed");
});

test("browser Back while minimized restores the window on the earlier section", async ({
  page,
}) => {
  await page.goto("/");
  await icons(page).getByRole("link", { name: "About Me" }).dblclick();
  await icons(page).getByRole("link", { name: "Projects" }).dblclick();
  await expect(h1(page)).toHaveText("Projects");
  await minimize(page).click();
  await page.goBack();
  await expect(browserWindow(page)).toBeVisible();
  await expect(h1(page)).toHaveText("About Me");
  await expect(taskButton(page, "About Me")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Forward" })).toBeEnabled();
});

test("browser Forward while minimized restores the window", async ({ page }) => {
  await page.goto("/");
  await icons(page).getByRole("link", { name: "About Me" }).dblclick();
  await expect(h1(page)).toHaveText("About Me");
  await page.goBack();
  await expect(h1(page)).toHaveText(e2eOwnerName);
  await page.goForward();
  await minimize(page).click();
  await page.goBack();
  await page.goForward();
  await expect(browserWindow(page)).toBeVisible();
  await expect(h1(page)).toHaveText("About Me");
});

test("the skip link brings a minimized window back", async ({ page }) => {
  await page.goto("/projects/");
  await minimize(page).click();
  await page.getByRole("link", { name: "Skip the desktop to the page content" }).focus();
  await page.keyboard.press("Enter");
  await expect(browserWindow(page)).toBeVisible();
  await expect(page.locator("#main")).toBeFocused();
});

test("a reload shows the window open again, because the state is not kept", async ({ page }) => {
  await page.goto("/projects/");
  await minimize(page).click();
  await page.reload();
  await expect(browserWindow(page)).toBeVisible();
  await expect(taskButton(page, "Projects")).toHaveAttribute("aria-pressed", "true");
});

test("each title bar control has a hit area of at least 24 by 24 pixels", async ({ page }) => {
  await page.goto("/projects/");
  for (const control of [minimize(page), maximize(page), close(page)]) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
});

test("the title bar controls are hidden on the welcome window, which has none", async ({
  page,
}) => {
  await page.goto("/");
  await expect(minimize(page)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Close" })).toHaveCount(0);
  await expect(page.locator(".control")).toHaveCount(0);
});

test.describe("without JavaScript", () => {
  test("Close is a plain link to the desktop and Minimize is not shown", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/projects/");
    await expect(minimize(page)).toHaveCount(0);
    await expect(maximize(page)).toHaveCount(0);
    await expect(close(page)).toHaveCount(0);
    await expect(taskButton(page, "Projects")).toHaveCount(0);
    const link = page.getByRole("link", { name: "Close" });
    await expect(link).toHaveAttribute("href", "/");
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
    await link.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(h1(page)).toHaveText(e2eOwnerName);
    await context.close();
  });
});

for (const address of ["/projects/index.html", "/projects"]) {
  test(`Close ends on the desktop from ${address}`, async ({ page }) => {
    await page.goto(address);
    await expect(h1(page)).toHaveText("Projects");
    await close(page).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(h1(page)).toHaveText(e2eOwnerName);
    await expect(browserWindow(page)).toHaveCount(0);
  });
}

test.describe("when the script cannot finish binding", () => {
  // Safari can throw a SecurityError from history.replaceState, which stops the script early.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      History.prototype.replaceState = () => {
        throw new DOMException("blocked", "SecurityError");
      };
    });
  });

  test("the script-only controls stay hidden and Close stays a working link", async ({ page }) => {
    await page.goto("/projects/");
    await expect(minimize(page)).toHaveCount(0);
    await expect(close(page)).toHaveCount(0);
    await expect(maximize(page)).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/js/);
    await page.getByRole("link", { name: "Close" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(h1(page)).toHaveText(e2eOwnerName);
  });

  test("a double click on the title bar does not maximize", async ({ page }) => {
    await page.goto("/projects/");
    await page.locator("#browser-title").dblclick();
    await expect(browserWindow(page)).not.toHaveAttribute("data-maximized", "true");
  });

  test("a Close that is run without any navigation loads the desktop normally", async ({
    page,
  }) => {
    await page.goto("/projects/");
    await page.evaluate(() =>
      document.querySelector<HTMLElement>('[data-window-action="close"]')?.click(),
    );
    await expect(page).toHaveURL(/\/$/);
    await expect(h1(page)).toHaveText(e2eOwnerName);
  });
});

test.describe("touch on a phone", () => {
  test("Minimize, restore and Close work by tap, fit 375px and are large enough", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto("/projects/");
    const fits = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await fits()).toBe(true);
    for (const control of [minimize(page), close(page)]) {
      await expect(control).toBeInViewport();
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(24);
      expect(box?.height).toBeGreaterThanOrEqual(24);
    }
    await minimize(page).tap();
    await expect(browserWindow(page)).toBeHidden();
    expect(await fits()).toBe(true);
    await taskButton(page, "Projects").tap();
    await expect(browserWindow(page)).toBeVisible();
    await close(page).tap();
    await expect(h1(page)).toHaveText(e2eOwnerName);
    expect(await fits()).toBe(true);
    await context.close();
  });
});
