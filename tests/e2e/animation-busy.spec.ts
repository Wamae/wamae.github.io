import { expect, test } from "@playwright/test";
import { html, h1, icons, toggle, startButton, record, busyLog } from "./animation-helpers";

test.describe("the hourglass busy cursor", () => {
  test("shows while a page loads, marks the region busy, and leaves the page usable", async ({
    page,
  }) => {
    await record(page);
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      (url) => url.pathname === "/about/",
      async (route) => {
        if (route.request().resourceType() !== "fetch") return route.continue();
        await held;
        await route.continue().catch(() => undefined);
      },
    );
    await page.goto("/projects/");
    await startButton(page).click();
    await page
      .getByRole("navigation", { name: "Start menu" })
      .getByRole("link", { name: "About Me" })
      .click();
    await expect(html(page)).toHaveAttribute("data-busy", "true");
    await expect(page.locator('[data-swap="stage"]')).toHaveAttribute("aria-busy", "true");
    // The page that is there stays usable while the next one loads.
    await expect(h1(page)).toHaveText("Projects");
    await page.getByRole("button", { name: "Maximize" }).click();
    await expect(page.getByRole("button", { name: "Restore" })).toBeFocused();
    release();
    await expect(h1(page)).toHaveText("About Me");
    await expect(html(page)).not.toHaveAttribute("data-busy", "true");
    await expect(page.locator('[data-swap="stage"]')).not.toHaveAttribute("aria-busy", "true");
  });

  test("a fast load still keeps the cursor for a short minimum, but never holds the content", async ({
    page,
  }) => {
    await record(page);
    await page.goto("/");
    await icons(page).getByRole("link", { name: "About Me" }).dblclick();
    await expect(h1(page)).toHaveText("About Me");
    await expect(page.locator("#main")).toBeFocused();
    await expect(html(page)).not.toHaveAttribute("data-busy", "true");
    const [entry] = await busyLog(page);
    expect((entry?.off ?? 0) - (entry?.on ?? 0)).toBeGreaterThanOrEqual(290);
  });

  test("with animations switched off the cursor goes as soon as the load ends", async ({
    page,
  }) => {
    await record(page);
    await page.goto("/");
    await toggle(page).click();
    await icons(page).getByRole("link", { name: "About Me" }).dblclick();
    await expect(h1(page)).toHaveText("About Me");
    await expect(html(page)).not.toHaveAttribute("data-busy", "true");
    const [entry] = await busyLog(page);
    expect((entry?.off ?? 0) - (entry?.on ?? 0)).toBeLessThan(250);
  });

  test("back and forward and in-window links use it too", async ({ page }) => {
    await record(page);
    await page.goto("/");
    await icons(page).getByRole("link", { name: "About Me" }).dblclick();
    await expect(h1(page)).toHaveText("About Me");
    await page.goBack();
    await expect(h1(page)).toHaveText("E2E Test Owner");
    await expect.poll(async () => (await busyLog(page)).length).toBe(2);
    await expect(html(page)).not.toHaveAttribute("data-busy", "true");
  });
});
