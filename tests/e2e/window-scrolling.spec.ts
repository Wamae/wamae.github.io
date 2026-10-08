import { expect, test, type Page } from "@playwright/test";
import { e2eOwnerName } from "../../playwright.config";

const h1 = (page: Page) => page.getByRole("heading", { level: 1 });
const minimize = (page: Page) => page.getByRole("button", { name: "Minimize" });
const maximize = (page: Page) => page.getByRole("button", { name: "Maximize" });
const restore = (page: Page) => page.getByRole("button", { name: "Restore" });
const close = (page: Page) => page.getByRole("button", { name: "Close" });
const status = (page: Page) => page.locator("[data-page-status]");
const browserWindow = (page: Page) => page.locator("#browser");
const clientArea = (page: Page) => page.locator("[data-scroll-client]");
const taskButton = (page: Page, name: string) =>
  page.getByRole("region", { name: "Taskbar" }).getByRole("button", { name });
const icons = (page: Page) => page.getByRole("navigation", { name: "Desktop folders" });

/** Long content with a link to a place at the bottom, so there is something to scroll. */
async function addLongContent(page: Page) {
  await page.evaluate(() => {
    const main = document.querySelector("main");
    const link = document.createElement("a");
    link.href = "#bottom";
    link.textContent = "Jump to the bottom";
    main?.append(link);
    for (let line = 0; line < 120; line++) {
      const paragraph = document.createElement("p");
      paragraph.textContent = `Line ${line}: placeholder text that only makes the page long.`;
      main?.append(paragraph);
    }
    const bottom = document.createElement("h2");
    bottom.id = "bottom";
    bottom.textContent = "The bottom";
    main?.append(bottom);
  });
}

const box = async (page: Page, selector: string) => {
  const rect = await page.locator(selector).boundingBox();
  if (rect === null) throw new Error(`${selector} has no box`);
  return rect;
};

const scrollState = (page: Page) =>
  page.evaluate(() => {
    const area = document.querySelector<HTMLElement>("[data-scroll-client]");
    return {
      pageY: window.scrollY,
      pageOverflows: document.documentElement.scrollHeight > window.innerHeight,
      areaTop: area?.scrollTop ?? -1,
      areaOverflows: (area?.scrollHeight ?? 0) > (area?.clientHeight ?? 0),
    };
  });

test.describe("scrolling inside the window", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const path of ["/projects/", "/experience/"]) {
    test(`${path} keeps its size and scrolls the content area, not the page`, async ({ page }) => {
      await page.goto(path);
      const before = await box(page, "#browser");
      await addLongContent(page);
      const state = await scrollState(page);
      expect(state.areaOverflows).toBe(true);
      expect(state.pageOverflows).toBe(false);
      expect(await box(page, "#browser")).toEqual(before);
      await clientArea(page).hover();
      await page.mouse.wheel(0, 400);
      await expect.poll(async () => (await scrollState(page)).areaTop).toBeGreaterThan(0);
      expect((await scrollState(page)).pageY).toBe(0);
    });
  }

  test("the content area is a named group that Tab reaches, and Page and End keys scroll it", async ({
    page,
  }) => {
    await page.goto("/projects/");
    await addLongContent(page);
    for (let presses = 0; presses < 30; presses++) {
      await page.keyboard.press("Tab");
      if (await clientArea(page).evaluate((el) => el === document.activeElement)) break;
    }
    await expect(clientArea(page)).toBeFocused();
    await expect(page.getByRole("group", { name: "Projects content" })).toBeFocused();
    await expect(clientArea(page)).toHaveCSS("outline-style", "dotted");
    await page.keyboard.press("PageDown");
    await expect.poll(async () => (await scrollState(page)).areaTop).toBeGreaterThan(0);
    await page.keyboard.press("End");
    await expect
      .poll(() =>
        clientArea(page).evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop),
      )
      .toBeLessThanOrEqual(1);
    await page.keyboard.press("Home");
    await expect.poll(async () => (await scrollState(page)).areaTop).toBe(0);
    // No keyboard trap: Tab moves on.
    await page.keyboard.press("Tab");
    await expect(clientArea(page)).not.toBeFocused();
    expect((await scrollState(page)).pageY).toBe(0);
  });

  test("a link to a place on the page scrolls the content area to it, with the page still", async ({
    page,
  }) => {
    await page.goto("/projects/");
    await addLongContent(page);
    await page.getByRole("link", { name: "Jump to the bottom" }).click();
    await expect(page.locator("#bottom")).toBeInViewport();
    const inside = await page.evaluate(() => {
      const area = document.querySelector("[data-scroll-client]")?.getBoundingClientRect();
      const target = document.querySelector("#bottom")?.getBoundingClientRect();
      return (
        target !== undefined &&
        area !== undefined &&
        target.top >= area.top &&
        target.bottom <= area.bottom
      );
    });
    expect(inside).toBe(true);
    const state = await scrollState(page);
    expect(state.areaTop).toBeGreaterThan(0);
    expect(state.pageY).toBe(0);
  });

  test("the inner scroll position is restored after minimize and restore", async ({ page }) => {
    await page.goto("/projects/");
    await addLongContent(page);
    await clientArea(page).evaluate((el) => el.scrollTo(0, 500));
    const before = (await scrollState(page)).areaTop;
    expect(before).toBeGreaterThan(0);
    await taskButton(page, "Projects").click();
    await expect(browserWindow(page)).toBeHidden();
    await taskButton(page, "Projects").click();
    await expect(browserWindow(page)).toBeVisible();
    expect((await scrollState(page)).areaTop).toBe(before);
    expect((await scrollState(page)).pageY).toBe(0);
  });

  test("Program Manager and File Manager scroll inside the window too", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    for (const path of ["/program-manager/", "/file-manager/"]) {
      await page.goto(path);
      const state = await scrollState(page);
      expect(state.pageOverflows).toBe(false);
      expect(state.areaOverflows).toBe(true);
    }
  });

  test("the taskbar stays at the bottom of the screen", async ({ page }) => {
    await page.goto("/projects/");
    await addLongContent(page);
    const taskbar = await box(page, '[aria-label="Taskbar"]');
    expect(Math.round(taskbar.y + taskbar.height)).toBe(800);
  });
});

test.describe("maximize and restore", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("Maximize fills the desktop above the status bar, and Restore puts the size back", async ({
    page,
  }) => {
    await page.goto("/projects/");
    const normal = await box(page, "#browser");
    await maximize(page).click();

    await expect(restore(page)).toBeFocused();
    await expect(status(page)).toHaveText("Projects maximized");
    await expect(browserWindow(page)).toHaveAttribute("data-maximized", "true");
    const full = await box(page, "#browser");
    const footer = await box(page, "footer");
    const taskbar = await box(page, '[aria-label="Taskbar"]');
    expect(full.x).toBe(0);
    expect(full.y).toBe(0);
    expect(full.width).toBe(1280);
    expect(Math.round(full.y + full.height)).toBe(Math.round(footer.y));
    expect(footer.y + footer.height).toBeLessThanOrEqual(taskbar.y + 1);
    // The desktop folders are covered, so they are not reachable either.
    await expect(icons(page)).toHaveJSProperty("inert", true);

    await restore(page).click();
    await expect(maximize(page)).toBeFocused();
    await expect(status(page)).toHaveText("Projects restored to normal size");
    expect(await box(page, "#browser")).toEqual(normal);
    await expect(icons(page)).toHaveJSProperty("inert", false);
  });

  test("Enter and Space work on the button", async ({ page }) => {
    await page.goto("/projects/");
    await maximize(page).focus();
    await page.keyboard.press("Enter");
    await expect(browserWindow(page)).toHaveAttribute("data-maximized", "true");
    await expect(restore(page)).toBeFocused();
    await page.keyboard.press("Space");
    await expect(browserWindow(page)).not.toHaveAttribute("data-maximized", "true");
    await expect(maximize(page)).toBeFocused();
  });

  test("a double click on the title bar toggles, but on a button it does not", async ({ page }) => {
    await page.goto("/projects/");
    await page.locator("#browser-title").dblclick();
    await expect(browserWindow(page)).toHaveAttribute("data-maximized", "true");
    await page.locator("#browser-title").dblclick();
    await expect(browserWindow(page)).not.toHaveAttribute("data-maximized", "true");
    // The double click event on a button is for the button's own clicks, not the title bar's.
    await maximize(page).dispatchEvent("dblclick");
    await expect(maximize(page)).toBeVisible();
    await expect(browserWindow(page)).not.toHaveAttribute("data-maximized", "true");
  });

  test("a maximized window stays maximized after minimize and restore", async ({ page }) => {
    await page.goto("/projects/");
    await maximize(page).click();
    await minimize(page).click();
    await expect(browserWindow(page)).toBeHidden();
    await expect(icons(page)).toHaveJSProperty("inert", false);
    await taskButton(page, "Projects").click();
    await expect(browserWindow(page)).toHaveAttribute("data-maximized", "true");
    await expect(restore(page)).toBeVisible();
    expect((await box(page, "#browser")).width).toBe(1280);
  });

  test("close and reopen gives a normal window again", async ({ page }) => {
    await page.goto("/projects/");
    await maximize(page).click();
    await close(page).click();
    await expect(h1(page)).toHaveText(e2eOwnerName);
    await icons(page).getByRole("link", { name: "About Me" }).dblclick();
    await expect(h1(page)).toHaveText("About Me");
    await expect(browserWindow(page)).not.toHaveAttribute("data-maximized", "true");
    await expect(maximize(page)).toBeVisible();
  });

  test("opening another section keeps a maximized window maximized", async ({ page }) => {
    await page.goto("/projects/");
    await maximize(page).click();
    await page.locator("summary", { hasText: "Start" }).click();
    await page
      .getByRole("navigation", { name: "Start menu" })
      .getByRole("link", { name: "Contact" })
      .click();
    await expect(h1(page)).toHaveText("Contact");
    await expect(browserWindow(page)).toHaveAttribute("data-maximized", "true");
  });

  test("a reload shows a normal window, because the state is not kept", async ({ page }) => {
    await page.goto("/projects/");
    await maximize(page).click();
    await page.reload();
    await expect(browserWindow(page)).not.toHaveAttribute("data-maximized", "true");
    await expect(maximize(page)).toBeVisible();
  });
});

test.describe("on a phone", () => {
  test("the window fills the width, has no Maximize, and scrolls inside", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/projects/");
    await expect(maximize(page)).toHaveCount(0);
    await expect(restore(page)).toHaveCount(0);
    const window_ = await box(page, "#browser");
    expect(window_.x).toBeGreaterThanOrEqual(0);
    expect(window_.width).toBeGreaterThan(375 - 24);
    await addLongContent(page);
    const state = await scrollState(page);
    expect(state.areaOverflows).toBe(true);
    expect(state.pageOverflows).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
    // A double click on the title bar does nothing here.
    await page.locator("#browser-title").dblclick();
    await expect(browserWindow(page)).not.toHaveAttribute("data-maximized", "true");
    expect(await box(page, "#browser")).toEqual(window_);
    await expect(minimize(page)).toBeVisible();
    await expect(close(page)).toBeVisible();
  });
});

test.describe("without JavaScript", () => {
  test("the window has its default size, scrolls inside, and has no Maximize", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 800, height: 500 },
    });
    const page = await context.newPage();
    await page.goto("/file-manager/");
    await expect(maximize(page)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Close" })).toBeVisible();
    const state = await scrollState(page);
    expect(state.areaOverflows).toBe(true);
    expect(state.pageOverflows).toBe(false);
    await context.close();
  });
});

test.describe("when the screen changes size while the window is maximized", () => {
  test("the covered parts are skipped only while the window really covers them", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/projects/");
    await maximize(page).click();
    await expect(icons(page)).toHaveJSProperty("inert", true);

    // On a phone the window is not on top of the folders, and there is no Maximize.
    await page.setViewportSize({ width: 375, height: 800 });
    await expect(icons(page)).toHaveJSProperty("inert", false);
    await expect(icons(page).getByRole("link", { name: "About Me" })).toBeVisible();
    await expect(maximize(page)).toHaveCount(0);
    await expect(restore(page)).toHaveCount(0);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(icons(page)).toHaveJSProperty("inert", true);
    await expect(restore(page)).toBeVisible();
  });

  test("on a short screen the status bar is skipped too, and back on a tall one it is not", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/projects/");
    await maximize(page).click();
    await expect(page.locator("body > footer")).toHaveJSProperty("inert", false);
    await page.setViewportSize({ width: 1280, height: 400 });
    await expect(page.locator("body > footer")).toHaveJSProperty("inert", true);
    await restore(page).click();
    await expect(page.locator("body > footer")).toHaveJSProperty("inert", false);
  });
});
