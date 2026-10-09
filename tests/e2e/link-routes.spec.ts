import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { load } from "js-yaml";
import { buildLinkRoutes, type LinkRoute } from "../../src/content/link-routes";
import { canEmbed } from "../../src/shell/link-kind";
import {
  boxOf,
  browserWindow,
  expectNear,
  h1,
  icons,
  outlineEnded,
  outlines,
  record,
  startButton,
  status,
  taskbar,
} from "./animation-helpers";

// The pages that exist are read from the real content file, so an edit of it cannot break these tests.
const content = load(readFileSync("content/cv.yml", "utf8")) as Parameters<
  typeof buildLinkRoutes
>[0];
const routes = buildLinkRoutes(content);
const first = routes[0] as LinkRoute | undefined;
const framed = routes.find((route) => canEmbed(route.url, route.embed));
const blocked = routes.find((route) => !canEmbed(route.url, route.embed));

const stub = `<!doctype html><title>Stub</title><h1>Stubbed external page</h1>`;
const addressBar = (page: Page) => page.getByRole("textbox", { name: "Address" });
const back = (page: Page) => page.getByRole("button", { name: "Back" });
const forward = (page: Page) => page.getByRole("button", { name: "Forward" });

/** Keeps every request to another site off the network. */
async function stubExternalSites(page: Page) {
  for (const route of routes) {
    await page.route(`${new URL(route.url).origin}/**`, (request) =>
      request.fulfill({ contentType: "text/html", body: stub }),
    );
  }
}

/** Adds a link to a page of this site to the page that is open, as the views will. */
async function addLink(page: Page, route: LinkRoute) {
  await page.evaluate(
    ({ href, label }) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = `Open ${label}`;
      link.dataset["injected"] = "";
      document.querySelector("main")?.append(link);
    },
    { href: route.path, label: route.label },
  );
  return page.getByRole("link", { name: `Open ${route.label}` });
}

const markDocument = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "same-document";
  });
const marker = (page: Page) =>
  page.evaluate(() => (window as unknown as { marker?: string }).marker);

test.describe("pages of external links are routes of the window", () => {
  test.skip(first === undefined, "the content file has no links");
  const route = first as LinkRoute;

  test.beforeEach(async ({ page }) => {
    await stubExternalSites(page);
  });

  test("a link to one is swapped in place, with history, and Back and Forward come back", async ({
    page,
  }) => {
    await page.goto("/about/");
    await markDocument(page);
    await (await addLink(page, route)).click();

    await expect(h1(page)).toHaveText(route.label);
    await expect(page).toHaveURL(new RegExp(`${route.path}$`));
    await expect(addressBar(page)).toHaveValue(route.url);
    await expect(page).toHaveTitle(
      new RegExp(`^${route.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} - `),
    );
    await expect(back(page)).toBeEnabled();
    await expect(forward(page)).toBeDisabled();
    expect(await marker(page)).toBe("same-document");

    await back(page).click();
    await expect(h1(page)).toHaveText("About Me");
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(forward(page)).toBeEnabled();
    await forward(page).click();
    await expect(h1(page)).toHaveText(route.label);
    await expect(addressBar(page)).toHaveValue(route.url);
    expect(await marker(page)).toBe("same-document");
  });

  test("a deep link, then the Start menu, swaps About in without a page load", async ({ page }) => {
    await page.goto(route.path);
    await expect(addressBar(page)).toHaveValue(route.url);
    await markDocument(page);
    await startButton(page).click();
    await page
      .getByRole("navigation", { name: "Start menu" })
      .getByRole("link", { name: "About Me" })
      .click();
    await expect(h1(page)).toHaveText("About Me");
    await expect(addressBar(page)).toHaveValue(/\/about\/$/);
    expect(await marker(page)).toBe("same-document");
    await page.goBack();
    await expect(h1(page)).toHaveText(route.label);
    expect(await marker(page)).toBe("same-document");
  });

  test("two link pages and a section swap among each other", async ({ page }) => {
    const second = routes[1];
    test.skip(second === undefined, "the content file has only one link");
    await page.goto("/about/");
    await markDocument(page);
    await (await addLink(page, route)).click();
    await expect(h1(page)).toHaveText(route.label);
    await (await addLink(page, second as LinkRoute)).click();
    await expect(h1(page)).toHaveText((second as LinkRoute).label);
    await page.goBack();
    await expect(h1(page)).toHaveText(route.label);
    await page.goBack();
    await expect(h1(page)).toHaveText("About Me");
    expect(await marker(page)).toBe("same-document");
  });

  test("a refresh keeps the address and the toolbar states", async ({ page }) => {
    await page.goto("/about/");
    await (await addLink(page, route)).click();
    await expect(h1(page)).toHaveText(route.label);
    await page.reload();
    await expect(h1(page)).toHaveText(route.label);
    await expect(addressBar(page)).toHaveValue(route.url);
    await expect(back(page)).toBeEnabled();
    await expect(forward(page)).toBeDisabled();
    await back(page).click();
    await expect(h1(page)).toHaveText("About Me");
    await expect(forward(page)).toBeEnabled();
  });

  test("the window controls work on it, and the open zoom starts at the clicked link", async ({
    page,
  }) => {
    await record(page);
    await page.goto("/");
    const link = await addLink(page, route);
    const linkBox = await boxOf(link);
    await link.click();
    await expect(h1(page)).toHaveText(route.label);
    await outlineEnded(page, 1);
    expectNear((await outlines(page))[0]?.from, linkBox);
    expectNear((await outlines(page))[0]?.to, await boxOf(browserWindow(page)));

    const task = taskbar(page).getByRole("button", { name: route.label });
    await expect(task).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Maximize" }).click();
    await expect(status(page)).toHaveText(`${route.label} maximized`);
    await page.getByRole("button", { name: "Restore" }).click();
    await page.getByRole("button", { name: "Minimize" }).click();
    await expect(status(page)).toHaveText(`${route.label} minimized`);
    await expect(browserWindow(page)).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`${route.path}$`));
    await task.click();
    await expect(status(page)).toHaveText(`${route.label} restored`);
    await expect(browserWindow(page)).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(h1(page)).toHaveText("E2E Test Owner");
    await expect(page).toHaveURL(/\/$/);
    await expect(browserWindow(page)).toHaveCount(0);
    await expect(status(page)).toHaveText(`${route.label} closed`);
    await page.goBack();
    await expect(h1(page)).toHaveText(route.label);
    await expect(icons(page)).toBeVisible();
  });

  test("none of this opens another page or window", async ({ page, context }) => {
    const opened: string[] = [];
    context.on("page", (other) => opened.push(other.url()));
    await page.goto("/about/");
    await (await addLink(page, route)).click();
    await expect(h1(page)).toHaveText(route.label);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(h1(page)).toHaveText("About Me");
    await page.goForward();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(h1(page)).toHaveText("E2E Test Owner");
    expect(opened).toEqual([]);
  });
});

for (const [kind, target] of [
  ["framed", framed],
  ["blocked", blocked],
] as const) {
  test.describe(`a ${kind} link page`, () => {
    test.skip(target === undefined, `the content file has no ${kind} link`);
    const route = target as LinkRoute;

    test("opens in the window from a link", async ({ page }) => {
      await stubExternalSites(page);
      await page.goto("/about/");
      await markDocument(page);
      await (await addLink(page, route)).click();
      await expect(h1(page)).toHaveText(route.label);
      await expect(addressBar(page)).toHaveValue(route.url);
      await expect(page.locator("iframe.frame")).toHaveCount(kind === "framed" ? 1 : 0);
      expect(await marker(page)).toBe("same-document");
    });
  });
}
