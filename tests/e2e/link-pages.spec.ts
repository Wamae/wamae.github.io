import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { load } from "js-yaml";
import { buildLinkRoutes } from "../../src/content/link-routes";
import { canEmbed } from "../../src/shell/link-kind";

// Read the content file directly: Playwright cannot load it the way the build does. Only the links
// and certifications are needed to know which pages exist and which of them may be framed.
const content = load(readFileSync("content/cv.yml", "utf8")) as Parameters<
  typeof buildLinkRoutes
>[0];
const routes = buildLinkRoutes(content);
const framed = routes.find((route) => canEmbed(route.url, route.embed));

const stubbedPage = `<!doctype html><title>Stub</title><body>
<h1 id="stub">Stubbed external page</h1>
<script>
  window.__attempts = [];
  try { top.location.href = "https://evil.example.test/top"; } catch (e) { window.__attempts.push("top:" + e.name); }
  try { window.open("https://evil.example.test/popup"); } catch (e) { window.__attempts.push("open:" + e.name); }
  try { alert("hello"); } catch (e) { window.__attempts.push("alert:" + e.name); }
  try { parent.document.title = "hacked"; } catch (e) { window.__attempts.push("parent:" + e.name); }
</script>
</body>`;

test.describe("a link page that is shown in a frame", () => {
  test.skip(framed === undefined, "the content file has no link that may be framed");

  test.beforeEach(async ({ page }) => {
    const host = new URL(framed?.url ?? "https://example.test/").origin;
    await page.route(`${host}/**`, (route) =>
      route.fulfill({ contentType: "text/html", body: stubbedPage }),
    );
  });

  test("the frame fits inside the window's content area at desktop size", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(framed?.path ?? "/");

    const frame = page.locator("iframe.frame");
    await expect(frame).toBeVisible();
    const box = await frame.boundingBox();
    const client = await page.locator(".client").boundingBox();
    expect(box).not.toBeNull();
    expect(client).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
      (client?.y ?? 0) + (client?.height ?? 0) + 1,
    );
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(280);
    const pageScrolls = await page.evaluate(
      () => document.documentElement.scrollHeight > innerHeight,
    );
    expect(pageScrolls).toBe(false);
  });

  test("on a phone the frame is still usable and the page does not scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(framed?.path ?? "/");

    await expect(page.locator("iframe.frame")).toBeAttached();
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(sideways).toBeLessThanOrEqual(0);
  });

  test("the framed page cannot navigate the window, open a tab or reach into the page", async ({
    page,
    context,
  }) => {
    const opened: string[] = [];
    context.on("page", (newPage) => opened.push(newPage.url()));
    let dialogs = 0;
    page.on("dialog", async (dialog) => {
      dialogs += 1;
      await dialog.dismiss();
    });
    await page.goto(framed?.path ?? "/");
    const frame = page.frameLocator("iframe.frame");
    await expect(frame.locator("#stub")).toHaveText("Stubbed external page");

    expect(page.url()).toContain(framed?.path ?? "/");
    expect(await page.title()).not.toBe("hacked");
    expect(opened).toEqual([]);
    expect(dialogs).toBe(0);
    const attempts = await page
      .frames()[1]
      ?.evaluate(() => (window as unknown as { __attempts: string[] }).__attempts);
    expect(attempts?.some((attempt) => attempt.startsWith("top:"))).toBe(true);
    expect(attempts?.some((attempt) => attempt.startsWith("parent:"))).toBe(true);
  });
});
