import { expect, test, type Page } from "@playwright/test";

const titleBar = (page: Page) => page.locator("#browser .titlebar").first();
const toolbar = (page: Page) => page.getByRole("group", { name: "Browser toolbar" });

/** Adds a link to a place on another page, to follow it from the page that is open. */
async function addFragmentLink(page: Page) {
  await page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "/file-manager/#tree-title";
    link.textContent = "Open the folders";
    document.querySelector("main")?.append(link);
  });
}

const desktopOffset = (page: Page) =>
  page.evaluate(() => {
    const desktop = document.querySelector(".desktop");
    return { top: desktop?.scrollTop ?? -1, left: desktop?.scrollLeft ?? -1, page: scrollY };
  });

test("a link to a place on another page keeps the title bar in view at 640x600", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 600 });
  await page.goto("/about/");
  await addFragmentLink(page);
  await page.getByRole("link", { name: "Open the folders" }).click();
  await expect(page).toHaveURL(/\/file-manager\/#tree-title$/);
  await expect(page.locator("#tree-title")).toBeInViewport();
  await expect(titleBar(page)).toBeInViewport();
  await expect(toolbar(page)).toBeInViewport();
  const offset = await desktopOffset(page);
  expect(offset).toEqual({ top: 0, left: 0, page: 0 });
});

// On a short screen the page itself scrolls (the window is as tall as its content), so a target far
// down the page rightly scrolls the title bar away, like any web page. What must still hold is that
// the target is in view and the desktop area does not scroll or shift sideways.
test("a link to a place on another page shows the target at 640x400", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/about/");
  await addFragmentLink(page);
  await page.getByRole("link", { name: "Open the folders" }).click();
  await expect(page).toHaveURL(/\/file-manager\/#tree-title$/);
  await expect(page.locator("#tree-title")).toBeInViewport();
  const offset = await desktopOffset(page);
  expect(offset.top).toBe(0);
  expect(offset.left).toBe(0);
});

for (const width of [640, 700, 767]) {
  test(`the window is never narrower than 30rem or the desktop at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/projects/");
    const sizes = await page.evaluate(() => {
      const window_ = document.querySelector("#browser")?.getBoundingClientRect();
      const stage = document.querySelector(".stage")?.getBoundingClientRect();
      const desktop = document.querySelector(".desktop");
      return {
        window: window_?.width ?? 0,
        stage: stage?.width ?? 0,
        sideways: (desktop?.scrollWidth ?? 0) - (desktop?.clientWidth ?? 0),
        pageSideways: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(sizes.window).toBeGreaterThanOrEqual(Math.min(480, sizes.stage - 16) - 1);
    expect(sizes.sideways).toBeLessThanOrEqual(0);
    expect(sizes.pageSideways).toBeLessThanOrEqual(0);
  });
}

/** Long content, so that the window has more to show than a short screen has room for. */
async function addLongContent(page: Page) {
  await page.evaluate(() => {
    for (let line = 0; line < 60; line++) {
      const paragraph = document.createElement("p");
      paragraph.textContent = `Line ${line}: placeholder text that only makes the page long.`;
      document.querySelector("main")?.append(paragraph);
    }
  });
}

const clientHeight = (page: Page) =>
  page.locator("[data-scroll-client]").evaluate((el) => el.clientHeight);
const maximize = (page: Page) => page.getByRole("button", { name: "Maximize" });
const boxOf = async (page: Page, selector: string) => {
  const box = await page.locator(selector).boundingBox();
  if (box === null) throw new Error(`${selector} has no box`);
  return box;
};

for (const size of [
  { width: 640, height: 400 },
  { width: 667, height: 320 },
]) {
  test.describe(`on a short screen, ${size.width}x${size.height}`, () => {
    test.use({ viewport: size });

    test("the window is as tall as its content and the page scrolls to reach all of it", async ({
      page,
    }) => {
      await page.goto("/projects/");
      await addLongContent(page);
      expect(await clientHeight(page)).toBeGreaterThan(300);
      const reach = await page.evaluate(() => {
        scrollTo(0, document.documentElement.scrollHeight);
        const status = document.querySelector("#browser .status-bar")?.getBoundingClientRect();
        const taskbar = document.querySelector('[aria-label="Taskbar"]')?.getBoundingClientRect();
        return {
          scrolls: document.documentElement.scrollHeight > innerHeight,
          statusBottom: status?.bottom ?? 0,
          taskbarTop: taskbar?.top ?? 0,
          taskbarBottom: taskbar?.bottom ?? 0,
          height: innerHeight,
        };
      });
      expect(reach.scrolls).toBe(true);
      // The window's status bar is above the taskbar, which stays at the bottom of the screen.
      expect(reach.statusBottom).toBeLessThanOrEqual(reach.taskbarTop + 1);
      expect(Math.round(reach.taskbarBottom)).toBe(reach.height);
    });

    test("a maximized window fills the screen above the taskbar and does not move when the page scrolls", async ({
      page,
    }) => {
      await page.goto("/projects/");
      await addLongContent(page);
      await maximize(page).click();
      const before = await boxOf(page, "#browser");
      expect(before.x).toBe(0);
      expect(before.y).toBe(0);
      expect(before.width).toBe(size.width);
      expect(await clientHeight(page)).toBeGreaterThanOrEqual(90);
      await page.mouse.move(size.width / 2, size.height / 2);
      await page.mouse.wheel(0, 3000);
      await expect
        .poll(() => page.locator("[data-scroll-client]").evaluate((el) => el.scrollTop))
        .toBeGreaterThan(0);
      expect(await boxOf(page, "#browser")).toEqual(before);
      // Scrolling inside the window did not move the page behind it either.
      expect(await page.evaluate(() => scrollY)).toBe(0);
    });
  });
}

test("on a tall screen the window keeps its size, and scrolling inside it does not chain", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/projects/");
  const area = page.locator("[data-scroll-client]");
  await expect(area).toHaveCSS("overscroll-behavior-y", "contain");
  await maximize(page).click();
  await expect(page.locator(".desktop")).toHaveCSS("overflow-y", "hidden");
  await page.getByRole("button", { name: "Restore" }).click();
  await expect(page.locator(".desktop")).not.toHaveCSS("overflow-y", "hidden");
});
