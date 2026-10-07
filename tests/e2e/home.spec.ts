import { expect, test } from "@playwright/test";
import { e2eOwnerName } from "../../playwright.config";

test("the desktop loads with the owner name, icons, taskbar and no browser window", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(e2eOwnerName);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(e2eOwnerName);
  const icons = page.getByRole("navigation", { name: "Desktop folders" });
  await expect(icons.getByRole("link")).toHaveText([
    "About Me",
    "Work Experience",
    "Projects",
    "Contact",
  ]);
  await expect(page.locator("summary", { hasText: "Start" })).toBeVisible();
  await expect(page.locator("#browser")).toHaveCount(0);
});

test("the skip link jumps to the main content", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip the desktop to the page content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator("main#main:target")).toBeInViewport();
});

test("the taskbar clock shows the time as text", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-clock]")).toHaveText(/^\d\d:\d\d$/);
});
