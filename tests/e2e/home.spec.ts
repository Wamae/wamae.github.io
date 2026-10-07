import { expect, test } from "@playwright/test";
import { e2eOwnerName } from "../../playwright.config";

test("home page loads with a skip link and the owner name", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(e2eOwnerName);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(e2eOwnerName);

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
});

test("skip link activated with Enter jumps to the main content", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#main$/);
  // The fragment target is the main landmark, and it is on screen.
  await expect(page.locator("main#main:target")).toBeInViewport();
  // Focus has left the skip link, so the next Tab continues from the main content.
  await expect(page.getByRole("link", { name: "Skip to main content" })).not.toBeFocused();
});
