import { expect, test, type Page } from "@playwright/test";

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

// Nothing on the page animates yet, so the test adds a probe that would animate and checks
// that the reduced-motion rule in global.css is what stops it.
const probe = async (page: Page) => {
  await page.addStyleTag({
    content: `@keyframes probe-spin { to { opacity: 0.5; } }
      .probe { animation: probe-spin 5s infinite; transition: opacity 5s; }`,
  });
  await page.evaluate(() => {
    const element = document.createElement("div");
    element.className = "probe";
    document.body.append(element);
  });
  return page.locator(".probe").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      animationName: style.animationName,
      animationDuration: style.animationDuration,
      transitionDuration: style.transitionDuration,
      running: document.getAnimations().length,
    };
  });
};

test("without a motion preference the probe animates, so the next test can tell", async ({
  page,
}) => {
  await page.goto("/");
  const result = await probe(page);
  expect(result.animationName).toBe("probe-spin");
  expect(result.transitionDuration).toBe("5s");
  expect(result.running).toBeGreaterThan(0);
});

test("with reduced motion the reduced-motion rule switches animations and transitions off", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Program Manager" })).toBeVisible();

  const result = await probe(page);
  expect(result.animationName).toBe("none");
  expect(result.transitionDuration).toBe("0s");
  expect(result.running).toBe(0);
});

test("the directory tree fits its rows, so the last row is not clipped", async ({ page }) => {
  await page.goto("/");
  const tree = page.getByRole("navigation", { name: "Directory tree" });
  const sizes = await tree.evaluate((element) => ({
    scroll: element.scrollHeight,
    client: element.clientHeight,
  }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
  await expect(tree.getByRole("link", { name: "Contact" })).toBeInViewport({ ratio: 1 });
});

test("the skip link's focus ring is the desktop ring colour", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const link = page.getByRole("link", { name: "Skip to main content" });
  await expect(link).toBeFocused();
  const colour = await link.evaluate((element) => getComputedStyle(element).outlineColor);
  expect(colour).toBe("rgb(255, 255, 255)");
});

test("a focused File Manager entry draws the selection ring inside it", async ({ page }) => {
  await page.goto("/");
  const entry = page.getByRole("navigation", { name: "Directory tree" }).getByRole("link").first();
  await entry.focus();
  const style = await entry.evaluate((element) => {
    const computed = getComputedStyle(element);
    return { colour: computed.outlineColor, offset: computed.outlineOffset };
  });
  expect(style.colour).toBe("rgb(255, 255, 255)");
  expect(style.offset).toBe("-2px");
});

test("only Program Manager has an active title bar among the top-level windows", async ({
  page,
}) => {
  await page.goto("/");
  const bar = (name: string) =>
    page
      .getByRole("region", { name })
      .locator(".titlebar")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(await bar("Program Manager")).toBe("rgb(0, 0, 128)");
  for (const name of ["File Manager", "Experience", "Projects", "About", "Contact"]) {
    expect(await bar(name), name).toBe("rgb(255, 255, 255)");
  }
});

test("the four content windows sit two by two on a desktop and stack on a phone", async ({
  page,
}) => {
  await page.goto("/");
  const tops = async () =>
    Promise.all(
      ["Experience", "Projects", "About", "Contact"].map((name) =>
        page
          .getByRole("region", { name, exact: true })
          .evaluate((element) => Math.round(element.getBoundingClientRect().top + window.scrollY)),
      ),
    );
  const desktop = await tops();
  expect(desktop[0]).toBe(desktop[1]);
  expect(desktop[2]).toBe(desktop[3]);
  expect(desktop[2]).toBeGreaterThan(desktop[0] as number);

  await page.setViewportSize({ width: 375, height: 800 });
  const phone = await tops();
  expect(new Set(phone).size).toBe(4);
});

test("the page works with JavaScript turned off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByRole("region", { name: "File Manager" })).toBeVisible();
  await expect(page.getByText("Experience: content arrives in a later milestone.")).toBeVisible();
  await context.close();
});
