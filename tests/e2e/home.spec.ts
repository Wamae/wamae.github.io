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
