import { expect, test } from "@playwright/test";

test("the shell renders Program Manager, File Manager and the content windows", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("region", { name: "Program Manager" })).toBeVisible();
  await expect(page.getByRole("region", { name: "File Manager" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Accessories" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Work experience" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Directory tree" })).toBeVisible();
  // The 3D bevel is drawn with box-shadow, not images.
  const shadow = await page
    .getByRole("region", { name: "Program Manager" })
    .evaluate((element) => getComputedStyle(element).boxShadow);
  expect(shadow).not.toBe("none");
});

test("Tab reaches the skip links, then the program icons in order", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip the desktop to plain content" })).toBeFocused();

  for (const name of ["Work experience", "Projects by industry", "About me", "Contact"]) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name, exact: true }).first()).toBeFocused();
  }
});

test("the skip-the-desktop link lands on the plain content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#plain-content$/);
  await expect(page.locator("#plain-content")).toBeInViewport();
});

test("focus is visible: a dotted NT-style outline", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  const icon = page.getByRole("link", { name: "Work experience" });
  await expect(icon).toBeFocused();
  const outline = await icon.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(outline.style).toBe("dotted");
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
});

test("an icon link moves to its section", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Projects by industry" }).click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.getByRole("region", { name: "Projects" })).toBeInViewport();
});

test("at phone width nothing scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");

  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  await expect(page.getByRole("region", { name: "File Manager" })).toBeVisible();
});

test("with reduced motion the page renders the same and nothing animates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("region", { name: "Program Manager" })).toBeVisible();
  const animations = await page.evaluate(() => document.getAnimations().length);
  expect(animations).toBe(0);
});

test("the page works with JavaScript turned off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByRole("region", { name: "File Manager" })).toBeVisible();
  await expect(page.getByText("Experience: content arrives in a later milestone.")).toBeVisible();
  await context.close();
});
