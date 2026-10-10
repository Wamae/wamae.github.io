import { expect, test, type Page } from "@playwright/test";

const icons = (page: Page) => page.getByRole("navigation", { name: "Desktop folders" });
const startMenu = (page: Page) => page.getByRole("navigation", { name: "Start menu" });
const h1 = (page: Page) => page.getByRole("heading", { level: 1 });

const openFromStart = async (page: Page, name: string) => {
  await page.locator("summary", { hasText: "Start" }).click();
  await startMenu(page).getByRole("link", { name }).click();
};

const roleTitles = (page: Page) =>
  page
    .getByRole("main")
    .getByRole("heading", { level: 2 })
    .allTextContents()
    .then((titles) => titles.map((title) => title.trim()));

test("Work Experience from the desktop lists the roles newest first", async ({ page }) => {
  await page.goto("/");
  await icons(page).getByRole("link", { name: "Work Experience" }).dblclick();
  await expect(h1(page)).toHaveText("Work Experience");
  await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(9);
  const titles = await roleTitles(page);
  expect(titles[0]).toBe("Technical Project Manager");
  expect(titles[1]).toBe("Co-Organizer");
  expect(titles[2]).toBe("Senior Software Engineer");
  expect(titles.at(-1)).toBe("Java Web and Android Developer");
  await expect(page.getByText("Indeed Flex", { exact: true })).toBeVisible();
  await expect(page.getByText("Over 100K workers were paid the correct wages")).toBeVisible();
  await expect(page.locator("time").first()).toHaveAttribute("datetime", "2024-03");
});

test("Work Experience from the Start menu shows the same list", async ({ page }) => {
  await page.goto("/");
  await openFromStart(page, "Work Experience");
  await expect(h1(page)).toHaveText("Work Experience");
  expect((await roleTitles(page))[0]).toBe("Technical Project Manager");
});

test("Projects show one industry each, newest first, with industry counts", async ({ page }) => {
  await page.goto("/");
  await openFromStart(page, "Projects");
  await expect(h1(page)).toHaveText("Projects");
  const articles = page.locator("main li[id^=project-]");
  await expect(articles).toHaveCount(16);
  await expect(articles.first().getByRole("heading", { level: 3 })).toHaveText("Move Money");
  await expect(articles.last().getByRole("heading", { level: 3 })).toHaveText(
    "Open Data Kit deployment",
  );
  for (const article of await articles.all()) {
    await expect(article.getByText("Industry:")).toHaveCount(1);
  }
  await expect(page.getByRole("link", { name: "Fintech" })).toBeVisible();
  const summary = page.getByRole("main").locator("ul.industries");
  await expect(summary).toContainText("Fintech (6)");
  await expect(summary).toContainText("Public sector / data collection (1)");
});

test("About Me shows the summary, skills, education and certifications", async ({ page }) => {
  await page.goto("/");
  await icons(page).getByRole("link", { name: "About Me" }).dblclick();
  await expect(h1(page)).toHaveText("About Me");
  const main = page.getByRole("main");
  await expect(main).toContainText("I am a Technical Project Manager");
  await expect(main.getByRole("heading", { level: 2 })).toHaveText([
    "Key skills",
    "Education",
    "Certifications",
  ]);
  await expect(main).toContainText("BSc Software Engineering (Cum Laude)");
  // A certificate opens in the browser window (a page of this site) or, when its site cannot be shown
  // there, in a new tab at its real address.
  const certificateLinks = main.getByRole("region", { name: "Certifications" }).getByRole("link");
  expect(await certificateLinks.count()).toBeGreaterThan(0);
  const links = await certificateLinks.evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      href: anchor.getAttribute("href") ?? "",
      target: anchor.getAttribute("target"),
    })),
  );
  for (const link of links) {
    if (link.href.startsWith("/links/"))
      expect(link.href).toMatch(/^\/links\/[a-z0-9]+(-[a-z0-9]+)*\/$/);
    else expect(link).toEqual({ href: expect.stringMatching(/^https:\/\//), target: "_blank" });
  }
});

test("Contact shows the configured email and the public links", async ({ page }) => {
  await page.goto("/contact/");
  await expect(page.getByRole("link", { name: "e2e@example.invalid" })).toHaveAttribute(
    "href",
    "mailto:e2e@example.invalid",
  );
  await expect(page.getByRole("main").getByRole("listitem")).toHaveText([
    "GitHub",
    "LinkedIn",
    "Medium",
    "Twitter (X)",
    "Kaggle",
  ]);
});

test("deep links open each section straight away", async ({ page }) => {
  for (const [path, heading] of [
    ["/about/", "About Me"],
    ["/experience/", "Work Experience"],
    ["/projects/", "Projects"],
    ["/contact/", "Contact"],
  ] as const) {
    await page.goto(path);
    await expect(h1(page)).toHaveText(heading);
    await expect(page.locator("#browser-address")).toHaveValue(`https://wamae.github.io${path}`);
  }
  await page.goto("/projects/#project-move-money");
  await expect(page.locator("#project-move-money")).toBeInViewport();
});

test("without JavaScript the sections show their content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/experience/");
  await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(9);
  await page.goto("/projects/");
  await expect(page.locator("main li[id^=project-]")).toHaveCount(16);
  await page.goto("/about/");
  await expect(page.getByRole("main")).toContainText("Key skills");
  await context.close();
});

test("at phone width the content pages do not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ["/about/", "/experience/", "/projects/", "/contact/"]) {
    await page.goto(path);
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(widths.scroll, path).toBeLessThanOrEqual(widths.inner);
  }
});

test("a project link on /experience/ opens that project in the window, focused and in view", async ({
  page,
}) => {
  await page.goto("/experience/");
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "same-document";
  });
  await page.getByRole("main").getByRole("link", { name: "Western Union" }).click();

  await expect(h1(page)).toHaveText("Projects");
  await expect(page).toHaveURL(/\/projects\/#project-western-union$/);
  await expect(page.locator("#browser-address")).toHaveValue("https://wamae.github.io/projects/");
  const target = page.locator("#project-western-union");
  await expect(target).toBeFocused();
  await expect(target).toBeInViewport();
  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe(
    "same-document",
  );
});

test("a By industry link moves focus and scroll to that industry", async ({ page }) => {
  await page.goto("/projects/");
  await page.locator("ul.industries").getByRole("link", { name: "IoT" }).click();

  await expect(page).toHaveURL(/\/projects\/#industry-iot$/);
  const target = page.locator("#industry-iot");
  await expect(target).toBeFocused();
  await expect(target).toBeInViewport();
});

test("a By industry link works without JavaScript and lands on the industry", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/projects/");
  await page.locator("ul.industries").getByRole("link", { name: "Staffing" }).click();
  await expect(page).toHaveURL(/#industry-staffing$/);
  await expect(page.locator("#industry-staffing")).toBeInViewport();
  await context.close();
});

for (const path of ["/about/", "/experience/", "/projects/"]) {
  test(`bold figures on ${path} are bold and keep the text colour`, async ({ page }) => {
    await page.goto(path);
    const figures = page.getByRole("main").locator("strong");
    expect(await figures.count()).toBeGreaterThan(0);
    for (const figure of await figures.all()) {
      const style = await figure.evaluate((element) => {
        const own = getComputedStyle(element);
        const parent = getComputedStyle(element.parentElement as Element);
        return {
          weight: Number(own.fontWeight),
          colour: own.color,
          parentColour: parent.color,
          parentWeight: Number(parent.fontWeight),
          family: own.fontFamily,
        };
      });
      expect(style.weight).toBeGreaterThanOrEqual(700);
      expect(style.parentWeight).toBeLessThan(700);
      expect(style.colour).toBe(style.parentColour);
      expect(style.colour).toBe("rgb(0, 0, 0)");
      expect(style.family).toContain("Pixelify Sans");
    }
  });
}

test("no asterisk is visible anywhere on the content pages", async ({ page }) => {
  for (const path of ["/about/", "/experience/", "/projects/", "/contact/"]) {
    await page.goto(path);
    expect(await page.locator("body").innerText(), path).not.toContain("*");
  }
});

test("a bold figure is read as normal text by assistive technology", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("main")).toContainText("which brought a 3X increase in outgoing");
});
