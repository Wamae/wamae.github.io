import { expect, test, type Page } from "@playwright/test";

const site = "https://wamae.github.io";
const startButton = (page: Page) => page.locator("summary", { hasText: "Start" });
const startMenu = (page: Page) => page.getByRole("navigation", { name: "Start menu" });
const addressBar = (page: Page) => page.getByRole("textbox", { name: "Address" });

/** Tab until the Start button has focus. */
async function focusStart(page: Page) {
  await startButton(page).focus();
  await expect(startButton(page)).toBeFocused();
}

test("keyboard: Start opens with Enter, arrows move, Escape closes and returns focus", async ({
  page,
}) => {
  await page.goto("/");
  await focusStart(page);

  await page.keyboard.press("Enter");
  await expect(startMenu(page)).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await expect(startMenu(page).getByRole("link", { name: "About Me" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(startMenu(page).getByRole("link", { name: "Work Experience" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(startMenu(page).getByRole("button", { name: "Screen Saver" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(startMenu(page).getByRole("link", { name: "Show Desktop" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(startMenu(page).getByRole("link", { name: "About Me" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(startMenu(page).getByRole("button", { name: "Screen Saver" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(startMenu(page).getByRole("link", { name: "About Me" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(startMenu(page)).toBeHidden();
  await expect(startButton(page)).toBeFocused();
});

test("keyboard: choosing Projects in the Start menu opens it in the browser window", async ({
  page,
}) => {
  await page.goto("/");
  await focusStart(page);
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(startMenu(page).getByRole("link", { name: "Projects" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(addressBar(page)).toHaveValue(`${site}/projects/`);
  await expect(page).toHaveTitle(/^Projects - /);
  await expect(startMenu(page)).toBeHidden();
  await expect(page.locator("#main")).toBeFocused();
});

test("Space activates the focused Start menu item", async ({ page }) => {
  await page.goto("/");
  await focusStart(page);
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Me");
});

test("clicking outside closes the Start menu", async ({ page }) => {
  await page.goto("/");
  await startButton(page).click();
  await expect(startMenu(page)).toBeVisible();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(startMenu(page)).toBeHidden();
});

test("a desktop icon opens its section without a full page load", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "same-document";
  });
  await page
    .getByRole("navigation", { name: "Desktop folders" })
    .getByRole("link", { name: "Contact" })
    .dblclick();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(addressBar(page)).toHaveValue(`${site}/contact/`);
  await expect(page.getByRole("link", { name: "e2e@example.invalid" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe(
    "same-document",
  );
});

test("Work Experience is a desktop icon and is also in the Start menu", async ({ page }) => {
  await page.goto("/");
  const icons = page.getByRole("navigation", { name: "Desktop folders" });
  await expect(icons.getByRole("link", { name: "Work Experience" })).toHaveCount(1);
  await startButton(page).click();
  await startMenu(page).getByRole("link", { name: "Work Experience" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Work Experience");
  await expect(addressBar(page)).toHaveValue(`${site}/experience/`);
});

test("Back and Forward buttons and the browser's own back move through opened sections", async ({
  page,
}) => {
  await page.goto("/");
  const icons = page.getByRole("navigation", { name: "Desktop folders" });
  await icons.getByRole("link", { name: "About Me" }).dblclick();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Me");
  await icons.getByRole("link", { name: "Projects" }).dblclick();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");

  const back = page.getByRole("button", { name: "Back" });
  const forward = page.getByRole("button", { name: "Forward" });
  await expect(back).toBeEnabled();
  await expect(forward).toBeDisabled();

  await back.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Me");
  await expect(addressBar(page)).toHaveValue(`${site}/about/`);
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(forward).toBeEnabled();

  await forward.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");

  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Me");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/E2E Test Owner/);
  await expect(page.locator("#browser")).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Me");
});

test("a deep link loads with the window open, and Back is disabled", async ({ page }) => {
  await page.goto("/projects/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expect(addressBar(page)).toHaveValue(`${site}/projects/`);
  await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
});

test("Program Manager and File Manager open as pages in the browser window", async ({ page }) => {
  await page.goto("/");
  await startButton(page).click();
  await startMenu(page).getByRole("link", { name: "Program Manager" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Program Manager");
  await page.getByRole("link", { name: "File Manager" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("File Manager");
  await expect(addressBar(page)).toHaveValue(`${site}/file-manager/`);
});

test("the taskbar shows a button for the open window and none on the desktop", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".task-button")).toHaveCount(0);
  await page.goto("/projects/");
  await expect(
    page.getByRole("region", { name: "Taskbar" }).locator(".task-button:visible"),
  ).toHaveText("Projects");
});

test("without JavaScript every route shows its content and the Start menu links work", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const routes: [string, string][] = [
    ["/", "E2E Test Owner"],
    ["/about/", "About Me"],
    ["/experience/", "Work Experience"],
    ["/projects/", "Projects"],
    ["/contact/", "Contact"],
    ["/program-manager/", "Program Manager"],
    ["/file-manager/", "File Manager"],
  ];
  for (const [path, heading] of routes) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }

  await page.goto("/");
  await page.locator("summary", { hasText: "Start" }).click();
  await page
    .getByRole("navigation", { name: "Start menu" })
    .getByRole("link", { name: "Projects" })
    .click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expect(page.getByRole("heading", { level: 2, name: "By industry" })).toBeVisible();
  await context.close();
});

test("at phone width nothing scrolls sideways and the taskbar stays usable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ["/", "/projects/", "/file-manager/", "/program-manager/"]) {
    await page.goto(path);
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(widths.scroll, path).toBeLessThanOrEqual(widths.inner);
  }
  await startButton(page).click();
  await expect(startMenu(page)).toBeVisible();
  await expect(startMenu(page).getByRole("link", { name: "Contact" })).toBeInViewport({ ratio: 1 });
});

test("focus is visible: a dotted outline, white on the desktop", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const icon = page.getByRole("navigation", { name: "Desktop folders" }).getByRole("link").first();
  await expect(icon).toBeFocused();
  const outline = await icon.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor };
  });
  expect(outline.style).toBe("dotted");
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  expect(outline.colour).toBe("rgb(255, 255, 255)");
});

test("the browser window and taskbar use the NT palette", async ({ page }) => {
  await page.goto("/projects/");
  const colour = (selector: string, property: "backgroundColor" | "color") =>
    page
      .locator(selector)
      .first()
      .evaluate((element, p) => getComputedStyle(element)[p as "color"], property);
  expect(await colour("#browser .titlebar", "backgroundColor")).toBe("rgb(0, 0, 128)");
  expect(await colour(".taskbar", "backgroundColor")).toBe("rgb(192, 192, 192)");
  expect(await colour("#browser-address", "backgroundColor")).toBe("rgb(255, 255, 255)");
  const shadow = await page.locator("#browser").evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).not.toBe("none");
});

// Nothing animates yet, so the test adds a probe that would animate and checks that the
// reduced-motion rule in global.css is what stops it.
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
  expect(result.running).toBeGreaterThan(0);
});

test("with reduced motion the desktop renders and the reduced-motion rule stops animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  const result = await probe(page);
  expect(result.animationName).toBe("none");
  expect(result.transitionDuration).toBe("0s");
  expect(result.running).toBe(0);
});

const iconList = (page: Page) => page.getByRole("navigation", { name: "Desktop folders" });

test("a single mouse click selects an icon but does not open it", async ({ page, baseURL }) => {
  await page.goto("/");
  const icon = iconList(page).getByRole("link", { name: "Projects" });
  await icon.click();

  await expect(icon).toHaveAttribute("data-selected", "true");
  await expect(icon).toBeFocused();
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.locator("#browser")).toHaveCount(0);
  const background = await icon
    .locator(".label")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).toBe("rgb(0, 0, 128)");
  // Another click moves the selection.
  const other = iconList(page).getByRole("link", { name: "Contact" });
  await other.click();
  await expect(other).toHaveAttribute("data-selected", "true");
  await expect(icon).not.toHaveAttribute("data-selected", "true");
});

test("a double click opens the section and updates the address bar", async ({ page }) => {
  await page.goto("/");
  await iconList(page).getByRole("link", { name: "Projects" }).dblclick();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expect(addressBar(page)).toHaveValue(`${site}/projects/`);
  await expect(page).toHaveURL(/\/projects\/$/);
});

test("Enter on a focused icon opens it with one press", async ({ page }) => {
  await page.goto("/");
  const icon = iconList(page).getByRole("link", { name: "Work Experience" });
  await icon.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Work Experience");
  await expect(addressBar(page)).toHaveValue(`${site}/experience/`);
});

test("clicking elsewhere on the desktop clears the selection", async ({ page }) => {
  await page.goto("/");
  const icon = iconList(page).getByRole("link", { name: "About Me" });
  await icon.click();
  await expect(icon).toHaveAttribute("data-selected", "true");
  await page.getByRole("heading", { level: 1 }).click();
  await expect(icon).not.toHaveAttribute("data-selected", "true");
});

test("Tab visits the four desktop icons in order after the two skip links", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  for (const name of ["About Me", "Work Experience", "Projects", "Contact"]) {
    await page.keyboard.press("Tab");
    await expect(iconList(page).getByRole("link", { name })).toBeFocused();
  }
});

test("without JavaScript a single click on an icon opens the page", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await iconList(page).getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await context.close();
});

test("with a coarse pointer a single tap opens the section", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 800 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await iconList(page).getByRole("link", { name: "Contact" }).tap();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");
  await expect(addressBar(page)).toHaveValue(`${site}/contact/`);
  await context.close();
});

test("the browser window is a normal window that uses the desktop height above the taskbar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/projects/");
  const measures = await page.evaluate(() => {
    const window_ = document.querySelector("#browser")?.getBoundingClientRect();
    const footer = document.querySelector("footer")?.getBoundingClientRect();
    return {
      gap: Math.round((footer?.top ?? 0) - (window_?.bottom ?? 0)),
      height: window_?.height ?? 0,
      widthShare: (window_?.width ?? 0) / window.innerWidth,
    };
  });
  expect(measures.gap).toBeLessThanOrEqual(48);
  expect(measures.height).toBeGreaterThan(500);
  expect(measures.widthShare).toBeGreaterThan(0.6);
  expect(measures.widthShare).toBeLessThan(0.9);
});

test("at phone width the address field keeps the full address and fits the window", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/projects/");
  const field = addressBar(page);
  await expect(field).toHaveValue(`${site}/projects/`);
  const box = await field.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
});

test("the second skip link goes straight to the Start button", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to the Start menu" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(startButton(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(startMenu(page)).toBeVisible();
});

test("a mouse needs two clicks, but touch, pen and a synthetic click open at once", async ({
  page,
}) => {
  const dispatch = (type: string) =>
    page.evaluate((pointerType) => {
      const link = document.querySelector<HTMLElement>('[data-desktop-icon][href="/about/"]');
      link?.dispatchEvent(
        new PointerEvent("click", { bubbles: true, cancelable: true, detail: 1, pointerType }),
      );
    }, type);

  // Real mouse: the first click only selects, a second click on the selected icon opens.
  await page.goto("/");
  const about = iconList(page).getByRole("link", { name: "About Me" });
  await about.click();
  await expect(page.locator("#browser")).toHaveCount(0);
  await about.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Me");

  // A script click (assistive technology, voice control) has an empty pointer type.
  await page.goto("/");
  await page.evaluate(() =>
    document.querySelector<HTMLElement>('[data-desktop-icon][href="/about/"]')?.click(),
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Me");

  for (const pointerType of ["touch", "pen"]) {
    await page.goto("/");
    await dispatch(pointerType);
    await expect(page.getByRole("heading", { level: 1 }), pointerType).toHaveText("About Me");
  }

  // The same synthetic click, with the pointer type of a mouse, only selects.
  await page.goto("/");
  await dispatch("mouse");
  await expect(page.locator("#browser")).toHaveCount(0);
  await expect(page.locator('[data-desktop-icon][href="/about/"]')).toHaveAttribute(
    "data-selected",
    "true",
  );
});

test("a disabled Back button looks etched, in the approved disabled pair", async ({ page }) => {
  await page.goto("/projects/");
  const back = page.getByRole("button", { name: "Back" });
  await expect(back).toBeDisabled();
  const style = await back.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      colour: computed.color,
      shadow: computed.textShadow,
      background: computed.backgroundColor,
    };
  });
  expect(style.colour).toBe("rgb(128, 128, 128)");
  expect(style.background).toBe("rgb(192, 192, 192)");
  expect(style.shadow).toContain("rgb(255, 255, 255)");
});

test("on a short phone screen the taskbar never covers the focused item", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 300 });
  await page.goto("/file-manager/");
  const licence = page.getByRole("link", { name: "pixelarticons (MIT)" });
  await licence.focus();
  const boxes = await page.evaluate(() => {
    const link = document.activeElement?.getBoundingClientRect();
    const taskbar = document.querySelector(".taskbar")?.getBoundingClientRect();
    return {
      linkBottom: link?.bottom ?? 0,
      taskbarTop: taskbar?.top ?? 0,
      linkTop: link?.top ?? 0,
    };
  });
  expect(boxes.linkBottom).toBeLessThanOrEqual(boxes.taskbarTop);
  expect(boxes.linkTop).toBeGreaterThanOrEqual(0);
});

test("on a very short screen the Start menu scrolls instead of running off the top", async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 320 });
  await page.goto("/");
  await startButton(page).click();
  const panel = await startMenu(page).evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      scrollable: element.scrollHeight > element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
    };
  });
  expect(panel.top).toBeGreaterThanOrEqual(0);
  expect(panel.scrollable).toBe(true);
  expect(panel.overflowY).toBe("auto");
  await expect(startMenu(page).getByRole("link", { name: "About Me" })).toBeInViewport();
  await startMenu(page).getByRole("link", { name: "Show Desktop" }).focus();
  await expect(startMenu(page).getByRole("link", { name: "Show Desktop" })).toBeInViewport();
});

test("on a phone the four icons share one compact row", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  const tops = await iconList(page)
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => Math.round(link.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  for (const name of ["Work Experience", "About Me"]) {
    await expect(iconList(page).getByRole("link", { name })).toBeInViewport({ ratio: 1 });
  }
});

test("hovering an unselected icon does not make it look selected", async ({ page }) => {
  await page.goto("/");
  const selectedIcon = iconList(page).getByRole("link", { name: "About Me" });
  const hoveredIcon = iconList(page).getByRole("link", { name: "Contact" });
  await selectedIcon.click();
  await hoveredIcon.hover();
  const background = (icon: typeof hoveredIcon) =>
    icon.locator(".label").evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(await background(selectedIcon)).toBe("rgb(0, 0, 128)");
  expect(await background(hoveredIcon)).toBe("rgba(0, 0, 0, 0)");
});

test("at 320px a long browser title stays on one line and is cut with an ellipsis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/experience/");
  const title = page.locator("#browser-title");
  await expect(title).toHaveText("Work Experience - Web Browser");
  const style = await title.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      overflow: computed.textOverflow,
      whiteSpace: computed.whiteSpace,
      height: element.getBoundingClientRect().height,
      cut: element.scrollWidth > element.clientWidth,
    };
  });
  expect(style.overflow).toBe("ellipsis");
  expect(style.whiteSpace).toBe("nowrap");
  expect(style.height).toBeLessThan(35);
  // The text is wider than its box, so the ellipsis really is in use.
  expect(style.cut).toBe(true);
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
});

test("the address field is drawn as a sunken white field with black text", async ({ page }) => {
  await page.goto("/projects/");

  const address = page.locator("#browser-address");

  await expect(address).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(address).toHaveCSS("color", "rgb(0, 0, 0)");
  const shadow = await address.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).not.toBe("none");
});
