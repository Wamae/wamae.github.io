import { expect, test, type Page } from "@playwright/test";

const startButton = (page: Page) => page.locator("summary", { hasText: "Start" });
const startMenu = (page: Page) => page.getByRole("navigation", { name: "Start menu" });
const h1 = (page: Page) => page.getByRole("heading", { level: 1 });
const addressBar = (page: Page) => page.getByRole("textbox", { name: "Address" });

async function openFromStart(page: Page, name: string) {
  await startButton(page).click();
  await startMenu(page).getByRole("link", { name }).click();
}

/** Computed styles that only exist if the page's own component styles are loaded. */
async function styleMetrics(page: Page, route: string) {
  // A key press makes the next script focus count as keyboard focus, so the focus ring shows.
  await page.keyboard.press("Shift");
  return page.evaluate((path) => {
    const read = (selector: string, properties: string[]) => {
      const element = document.querySelector(selector);
      if (element === null) return { missing: selector };
      const style = getComputedStyle(element);
      return Object.fromEntries(
        properties.map((property) => [property, style.getPropertyValue(property)]),
      );
    };
    if (path === "/program-manager/") {
      return {
        workspace: read(".workspace", ["display", "background-color", "gap"]),
        icon: read(".program-icon", ["display", "flex-direction", "width"]),
        icons: read(".program-icon .glyph", ["width", "height"]),
      };
    }
    const entry = document.querySelector<HTMLElement>("a.entry");
    entry?.focus();
    return {
      panes: read(".panes", ["display", "grid-template-columns", "background-color"]),
      tree: read(".tree", ["background-color", "box-shadow"]),
      entry: read("a.entry", ["display", "outline-offset", "outline-color", "background-color"]),
    };
  }, route);
}

for (const route of ["/program-manager/", "/file-manager/"] as const) {
  test(`${route} looks the same after a swap as on a direct load`, async ({ browser }) => {
    const name = route === "/program-manager/" ? "Program Manager" : "File Manager";
    const swapped = await (await browser.newContext()).newPage();
    await swapped.goto("/");
    await openFromStart(swapped, name);
    await expect(h1(swapped)).toHaveText(name);
    await expect(swapped).toHaveURL(new RegExp(`${route}$`));
    const afterSwap = await styleMetrics(swapped, route);

    const direct = await (await browser.newContext()).newPage();
    await direct.goto(route);
    const afterLoad = await styleMetrics(direct, route);

    expect(afterSwap).toEqual(afterLoad);
    expect(JSON.stringify(afterLoad)).not.toContain("missing");
    await swapped.context().close();
    await direct.context().close();
  });
}

test("a slow page that is overtaken by a newer click does not change the URL or the content", async ({
  page,
  baseURL,
}) => {
  const aboutRequested = gate();
  const aboutHeld = gate();
  await page.route(
    (url) => url.pathname === "/about/",
    async (route) => {
      if (route.request().resourceType() !== "fetch") return route.continue();
      aboutRequested.release();
      await aboutHeld.opened;
      await route.continue().catch(() => undefined);
    },
  );
  await page.goto("/");
  const before = await page.evaluate(() => history.length);
  await openFromStart(page, "About Me");
  await aboutRequested.opened;
  await openFromStart(page, "Projects");
  await expect(h1(page)).toHaveText("Projects");
  aboutHeld.release();
  // Opening one more page after the stale response was released shows that nothing slipped in between.
  await openFromStart(page, "Contact");
  await expect(h1(page)).toHaveText("Contact");

  await expect(page).toHaveURL(`${baseURL}/contact/`);
  await expect(addressBar(page)).toHaveValue(/\/contact\/$/);
  await expect(page).toHaveTitle(/^Contact - /);
  expect(await page.evaluate(() => history.length)).toBe(before + 2);
  await page.goBack();
  await expect(page).toHaveURL(`${baseURL}/projects/`);
  await page.goBack();
  await expect(page).toHaveURL(`${baseURL}/`);
});

test("opening the page that is already loading or already open adds no request and no history entry", async ({
  page,
}) => {
  const requested = gate();
  const held = gate();
  let fetches = 0;
  await page.route(
    (url) => url.pathname === "/projects/",
    async (route) => {
      if (route.request().resourceType() !== "fetch") return route.continue();
      fetches++;
      requested.release();
      await held.opened;
      await route.continue().catch(() => undefined);
    },
  );
  await page.goto("/");
  const before = await page.evaluate(() => history.length);
  await openFromStart(page, "Projects");
  await requested.opened;
  // The same page again while it is loading.
  await openFromStart(page, "Projects");
  held.release();
  await expect(h1(page)).toHaveText("Projects");
  // And again once it is open.
  await openFromStart(page, "Projects");
  await expect(page.locator("#main")).toBeFocused();

  expect(fetches).toBe(1);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});

test("a failed fetch falls back to a normal page load", async ({ page }) => {
  await page.route("**/projects/", (route) =>
    route.request().resourceType() === "fetch" ? route.abort() : route.continue(),
  );
  await page.goto("/");
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "same-document";
  });
  await openFromStart(page, "Projects");

  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(h1(page)).toHaveText("Projects");
  expect(
    await page.evaluate(() => (window as unknown as { marker?: string }).marker),
  ).toBeUndefined();
});

test("links the script must not take over are left to the browser", async ({ page }) => {
  await page.goto("/contact/");
  const taken = await page.evaluate(() => {
    const results: Record<string, boolean> = {};
    const seen: boolean[] = [];
    // Runs after the script's own listener, records whether it already handled the click,
    // and then stops the browser from really navigating.
    window.addEventListener("click", (event) => {
      seen.push(event.defaultPrevented);
      event.preventDefault();
    });
    const make = (href: string, attributes: Record<string, string> = {}) => {
      const link = document.createElement("a");
      link.href = href;
      for (const [key, value] of Object.entries(attributes)) link.setAttribute(key, value);
      link.textContent = "x";
      document.body.append(link);
      return link;
    };
    const fire = (name: string, link: HTMLElement, init: MouseEventInit) => {
      seen.length = 0;
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
      results[name] = seen[0] ?? false;
    };
    const section = make("/projects/");
    fire("control", section, { ctrlKey: true });
    fire("shift", section, { shiftKey: true });
    fire("meta", section, { metaKey: true });
    fire("alt", section, { altKey: true });
    fire("middle", section, { button: 1 });
    fire("blank", make("/projects/", { target: "_blank" }), {});
    fire("download", make("/projects/", { download: "" }), {});
    fire("mailto", document.querySelector<HTMLElement>("a[href^='mailto:']") as HTMLElement, {});
    fire("licence", make("/licenses/pixelify-sans-OFL.txt"), {});
    fire("external", make("https://example.org/"), {});
    fire("plain", section, {});
    return results;
  });
  expect(taken).toEqual({
    control: false,
    shift: false,
    meta: false,
    alt: false,
    middle: false,
    blank: false,
    download: false,
    mailto: false,
    licence: false,
    external: false,
    plain: true,
  });
});

test("Show Desktop closes the browser window", async ({ page, baseURL }) => {
  await page.goto("/projects/");
  await openFromStart(page, "Show Desktop");
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(h1(page)).toHaveText("E2E Test Owner");
  await expect(page.locator("#browser")).toHaveCount(0);
  await expect(page.locator(".task-button")).toHaveCount(0);
});

test("the Back and Forward buttons stay right after a skip link entry", async ({ page }) => {
  await page.goto("/");
  await startButton(page).click();
  await startMenu(page).getByRole("link", { name: "About Me" }).click();
  await expect(h1(page)).toHaveText("About Me");

  await page.locator(".skip-link").first().focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await openFromStart(page, "Projects");
  await expect(h1(page)).toHaveText("Projects");

  const back = page.getByRole("button", { name: "Back" });
  const forward = page.getByRole("button", { name: "Forward" });
  await expect(back).toBeEnabled();
  await expect(forward).toBeDisabled();

  await page.goBack();
  await expect(h1(page)).toHaveText("About Me");
  await expect(back).toBeEnabled();
  await expect(forward).toBeEnabled();
  await page.goBack();
  await expect(back).toBeEnabled();
  await expect(forward).toBeEnabled();
  await page.goBack();
  await expect(page.locator("#browser")).toHaveCount(0);
  await page.goForward();
  await expect(back).toBeEnabled();
});

test("a page change is announced: the title goes to a status region and focus moves to the page", async ({
  page,
}) => {
  await page.goto("/");
  const status = page.getByRole("status");
  await expect(status).toHaveText("");
  await openFromStart(page, "Projects");
  await expect(status).toHaveText(/^Projects - /);
  await expect(page.locator("#main")).toBeFocused();
  await expect(page.getByRole("main", { name: "Projects" })).toBeFocused();
});

/** A promise you resolve yourself, to hold a request until the test is ready. */
function gate() {
  let release!: () => void;
  const opened = new Promise<void>((resolve) => (release = resolve));
  return { opened, release };
}

test("choosing the page on screen while Back is still loading keeps URL, content and toolbar in step", async ({
  page,
  baseURL,
}) => {
  const home = gate();
  const homeRequested = gate();
  await page.goto("/");
  await page.getByRole("link", { name: "About Me" }).first().focus();
  await page.keyboard.press("Enter");
  await expect(h1(page)).toHaveText("About Me");
  await expect(page).toHaveURL(`${baseURL}/about/`);

  await page.route(
    (url) => url.pathname === "/",
    async (route) => {
      if (route.request().resourceType() !== "fetch") return route.continue();
      homeRequested.release();
      await home.opened;
      await route.continue().catch(() => undefined);
    },
  );
  await page.evaluate(() => history.back());
  await homeRequested.opened;
  await page.getByRole("link", { name: "About Me" }).first().focus();
  await page.keyboard.press("Enter");
  home.release();

  await expect(h1(page)).toHaveText("About Me");
  await expect(page).toHaveURL(`${baseURL}/about/`);
  await expect(addressBar(page)).toHaveValue(/\/about\/$/);
  await expect(page.getByRole("button", { name: "Back" })).toBeEnabled();
  await page.reload();
  await expect(h1(page)).toHaveText("About Me");
  await page.goBack();
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.locator("#browser")).toHaveCount(0);
});

for (const fragment of ["main", "browser-address", "browser"]) {
  test(`a link to another page with #${fragment} keeps it in the URL and moves focus there`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width: 375, height: 300 });
    await page.goto("/");
    await startButton(page).click();
    await page.evaluate((id) => {
      const link = document.createElement("a");
      link.href = `/projects/#${id}`;
      link.textContent = "Projects fragment";
      document.querySelector("nav[aria-label='Start menu'] ul")?.append(link);
    }, fragment);
    await page.getByRole("link", { name: "Projects fragment" }).click();
    await expect(h1(page)).toHaveText("Projects");
    await expect(page).toHaveURL(`${baseURL}/projects/#${fragment}`);
    await expect(page.locator(`#${fragment}`)).toBeFocused();
    await expect(page.locator(`#${fragment}`)).toBeInViewport();
    await expect(startMenu(page)).toBeHidden();
  });
}

test("a fragment that matches nothing, or is malformed, moves focus to the page without errors", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const fragment of ["%E0%A4%A", "nothing-here"]) {
    await page.goto("/");
    await page.evaluate((hash) => {
      const link = document.createElement("a");
      link.href = `/projects/#${hash}`;
      link.textContent = "Odd fragment";
      document.body.append(link);
    }, fragment);
    await page.getByRole("link", { name: "Odd fragment" }).click();
    await expect(h1(page)).toHaveText("Projects");
    await expect(page.locator("#main")).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`^${baseURL}/projects/#`));
  }
  expect(errors).toEqual([]);
});

test("Forward stays enabled after a reload in the middle of the history", async ({ page }) => {
  await page.goto("/");
  await openFromStart(page, "About Me");
  await openFromStart(page, "Projects");
  await expect(h1(page)).toHaveText("Projects");
  await page.goBack();
  await expect(h1(page)).toHaveText("About Me");
  await page.reload();
  await expect(h1(page)).toHaveText("About Me");

  const forward = page.getByRole("button", { name: "Forward" });
  await expect(forward).toBeEnabled();
  await forward.click();
  await expect(h1(page)).toHaveText("Projects");
  await expect(forward).toBeDisabled();
});

// The two guards in the page loader. `fetch` is replaced here so that a stale load really does
// finish late: a real fetch is aborted by the script, which would hide a missing guard.
test("a stale load that ignores the abort adopts none of its styles", async ({ page }) => {
  await page.addInitScript(() => {
    const real = window.fetch.bind(window);
    const scope = window as unknown as { releaseProgramManager?: () => void };
    window.fetch = (input, init) => {
      if (!String(input).endsWith("/program-manager/")) return real(input, init);
      // No `signal` is passed on, so the script cannot abort this load.
      return new Promise((resolve) => {
        scope.releaseProgramManager = () => resolve(real(input));
      });
    };
  });
  await page.goto("/");
  await openFromStart(page, "Program Manager");
  await openFromStart(page, "Projects");
  await expect(h1(page)).toHaveText("Projects");
  await page.evaluate(() =>
    (window as unknown as { releaseProgramManager: () => void }).releaseProgramManager(),
  );
  await openFromStart(page, "Contact");
  await expect(h1(page)).toHaveText("Contact");

  const stylesFromTheStalePage = await page.evaluate(
    () =>
      [...document.head.querySelectorAll("style")].filter((s) =>
        s.textContent?.includes(".workspace"),
      ).length,
  );
  expect(stylesFromTheStalePage).toBe(0);
  await expect(page.locator(".workspace")).toHaveCount(0);
});

test("a stale load that was overtaken while its styles were loading does not swap the page", async ({
  page,
  baseURL,
}) => {
  const cssRequested = gate();
  const cssHeld = gate();
  await page.route(
    (url) => url.pathname === "/about/",
    async (route) => {
      if (route.request().resourceType() !== "fetch") return route.continue();
      const response = await route.fetch();
      const body = (await response.text()).replace(
        "</head>",
        '<link rel="stylesheet" href="/slow-test.css"></head>',
      );
      await route.fulfill({ response, body });
    },
  );
  await page.route("**/slow-test.css", async (route) => {
    cssRequested.release();
    await cssHeld.opened;
    await route.fulfill({ contentType: "text/css", body: "" });
  });
  await page.goto("/");
  await openFromStart(page, "About Me");
  await cssRequested.opened;
  await openFromStart(page, "Projects");
  await expect(h1(page)).toHaveText("Projects");
  cssHeld.release();
  // Wait until the stale page's stylesheet has loaded, then one frame, so the stale load has had
  // its chance to swap the page in.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.querySelector<HTMLLinkElement>('link[href="/slow-test.css"]')?.sheet !== null,
      ),
    )
    .toBe(true);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));

  await expect(h1(page)).toHaveText("Projects");
  await expect(page).toHaveURL(`${baseURL}/projects/`);
  await expect(page.locator("main#main")).toHaveAttribute("aria-label", "Projects");
});
