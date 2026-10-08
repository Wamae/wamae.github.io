import { expect, test } from "@playwright/test";
import {
  html,
  h1,
  icons,
  taskbar,
  browserWindow,
  startButton,
  record,
  outlines,
  expectNear,
  boxOf,
  outlineEnded,
} from "./animation-helpers";

test.describe("zoom outlines", () => {
  test.beforeEach(async ({ page }) => {
    await record(page);
  });

  test("opening a window from a desktop icon draws an outline from the icon to the window", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-animations", "on");
    const icon = icons(page).getByRole("link", { name: "Projects" });
    const iconBox = await boxOf(icon);
    await icon.dblclick();
    await expect(h1(page)).toHaveText("Projects");
    await outlineEnded(page, 1);
    const [outline] = await outlines(page);
    expectNear(outline?.from, iconBox);
    expectNear(outline?.to, await boxOf(browserWindow(page)));
    expect(outline?.hidden).toBe("true");
    expect(outline?.events).toBe("none");
    expect(outline?.position).toBe("fixed");
    // Above the taskbar and the Start menu.
    expect(Number(outline?.zIndex)).toBeGreaterThan(20);
  });

  test("the window is there at once, while the outline is only drawn over it", async ({ page }) => {
    await page.goto("/");
    await icons(page).getByRole("link", { name: "About Me" }).dblclick();
    await expect(h1(page)).toHaveText("About Me");
    await expect(page.locator("#main")).toBeFocused();
    await expect(browserWindow(page)).toBeVisible();
  });

  test("opening from the Start menu draws the outline from the item", async ({ page }) => {
    await page.goto("/");
    await startButton(page).click();
    const item = page.getByRole("navigation", { name: "Start menu" }).getByRole("link", {
      name: "Contact",
    });
    const itemBox = await boxOf(item);
    await item.click();
    await expect(h1(page)).toHaveText("Contact");
    await outlineEnded(page, 1);
    expectNear((await outlines(page))[0]?.from, itemBox);
  });

  test("minimize zooms to the taskbar button and restore zooms back from it", async ({ page }) => {
    await page.goto("/projects/");
    const windowBox = await boxOf(browserWindow(page));
    const task = taskbar(page).getByRole("button", { name: "Projects" });
    const taskBox = await boxOf(task);
    await page.getByRole("button", { name: "Minimize" }).click();
    await outlineEnded(page, 1);
    expectNear((await outlines(page))[0]?.from, windowBox);
    expectNear((await outlines(page))[0]?.to, taskBox);

    await task.click();
    await expect(browserWindow(page)).toBeVisible();
    await outlineEnded(page, 2);
    expectNear((await outlines(page))[1]?.from, taskBox);
    expectNear((await outlines(page))[1]?.to, await boxOf(browserWindow(page)));
  });

  test("maximize and restore zoom between the two sizes", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/projects/");
    const normal = await boxOf(browserWindow(page));
    await page.getByRole("button", { name: "Maximize" }).click();
    await outlineEnded(page, 1);
    const maximized = await boxOf(browserWindow(page));
    expectNear((await outlines(page))[0]?.from, normal);
    expectNear((await outlines(page))[0]?.to, maximized);

    await page.getByRole("button", { name: "Restore" }).click();
    await outlineEnded(page, 2);
    expectNear((await outlines(page))[1]?.from, maximized);
    expectNear((await outlines(page))[1]?.to, normal);
  });

  test("close zooms from the window to its desktop folder", async ({ page }) => {
    await page.goto("/projects/");
    const windowBox = await boxOf(browserWindow(page));
    const folderBox = await boxOf(icons(page).getByRole("link", { name: "Projects" }));
    await page.getByRole("button", { name: "Close" }).click();
    await expect(h1(page)).toHaveText("E2E Test Owner");
    await outlineEnded(page, 1);
    expectNear((await outlines(page))[0]?.from, windowBox);
    expectNear((await outlines(page))[0]?.to, folderBox);
  });

  test("a section opened inside an open window draws no outline", async ({ page }) => {
    await page.goto("/projects/");
    await startButton(page).click();
    await page
      .getByRole("navigation", { name: "Start menu" })
      .getByRole("link", { name: "Contact" })
      .click();
    await expect(h1(page)).toHaveText("Contact");
    expect(await outlines(page)).toEqual([]);
  });

  test("a new outline replaces the one that is running, and none is left behind", async ({
    page,
  }) => {
    await page.goto("/projects/");
    await page.getByRole("button", { name: "Minimize" }).click();
    await taskbar(page).getByRole("button", { name: "Projects" }).click();
    await expect.poll(async () => (await outlines(page)).length).toBe(2);
    await expect(page.locator(".zoom-outline")).toHaveCount(0);
    await expect(html(page)).not.toHaveAttribute("data-animating", "zoom");
  });
});
