import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildSite, type BuiltSite } from "../support/build-site";

let site: BuiltSite;
const pages: Record<string, string> = {};

const routes = [
  { path: "/", file: "index.html", h1: "Integration Owner", title: "Integration Owner" },
  {
    path: "/about/",
    file: "about/index.html",
    h1: "About Me",
    title: "About Me - Integration Owner",
  },
  {
    path: "/experience/",
    file: "experience/index.html",
    h1: "Work Experience",
    title: "Work Experience - Integration Owner",
  },
  {
    path: "/projects/",
    file: "projects/index.html",
    h1: "Projects",
    title: "Projects - Integration Owner",
  },
  {
    path: "/contact/",
    file: "contact/index.html",
    h1: "Contact",
    title: "Contact - Integration Owner",
  },
  {
    path: "/program-manager/",
    file: "program-manager/index.html",
    h1: "Program Manager",
    title: "Program Manager - Integration Owner",
  },
  {
    path: "/file-manager/",
    file: "file-manager/index.html",
    h1: "File Manager",
    title: "File Manager - Integration Owner",
  },
];
const sectionRoutes = routes.slice(1);

beforeAll(async () => {
  site = await buildSite({
    PUBLIC_OWNER_NAME: "Integration Owner",
    PUBLIC_OWNER_EMAIL: "integration@example.invalid",
  });
  for (const route of routes) pages[route.path] = await site.readFileText(route.file);
});

afterAll(async () => {
  await site?.remove();
});

const textOf = (fragment: string) =>
  fragment
    .replace(/<span[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

describe.each(routes)("page $path", ({ path, h1, title }) => {
  const html = () => pages[path] as string;

  it("has the title and exactly one h1", () => {
    expect(html()).toContain(`<title>${title}</title>`);
    expect(html().match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html()).toMatch(new RegExp(`<h1[^>]*>\\s*${h1}\\s*</h1>`));
    expect(html()).toMatch(/<html lang="en"/);
  });

  it("never skips a heading level on the way down", () => {
    const levels = [...html().matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    expect(levels[0]).toBe(1);
    levels.forEach((level, index) => {
      if (index > 0) expect(level - (levels[index - 1] as number)).toBeLessThanOrEqual(1);
    });
  });

  it("renders the same desktop: icons, taskbar and a Start menu of real links", () => {
    const icons = [
      ...html().matchAll(/<a\b[^>]*class="[^"]*desktop-icon[^"]*"[^>]*>([\s\S]*?)<\/a>/g),
    ];
    expect(icons.map((icon) => textOf(icon[1] as string))).toEqual([
      "About Me",
      "Work Experience",
      "Projects",
      "Contact",
    ]);
    expect(html()).toMatch(/<details[^>]*data-start-menu/);
    expect(html()).toMatch(/<summary[^>]*>[\s\S]*?Start\s*<\/summary>/);
    const menu = /<nav[^>]*aria-label="Start menu"[\s\S]*?<\/nav>/.exec(html())?.[0] ?? "";
    const links = [...menu.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
    expect(links.map((link) => [link[1], textOf(link[2] as string)])).toEqual([
      ["/about/", "About Me"],
      ["/experience/", "Work Experience"],
      ["/projects/", "Projects"],
      ["/contact/", "Contact"],
      ["/program-manager/", "Program Manager"],
      ["/file-manager/", "File Manager"],
      ["/", "Show Desktop"],
    ]);
    expect(html()).toContain("data-clock");
  });

  it("has one main landmark, a footer and one named nav, and two skip links, to main and to the Start button", () => {
    expect(html().match(/<main[\s>]/g)).toHaveLength(1);
    expect(html()).toMatch(/<footer[\s>]/);
    expect(html().match(/<nav[\s>]/g)?.length).toBeGreaterThanOrEqual(1);
    expect(html().match(/class="skip-link"/g)).toHaveLength(2);
    expect(html()).toMatch(/href="#start-button"[^>]*>\s*Skip to the Start menu/);
    expect(html()).toContain('id="start-button"');
    expect(html()).toMatch(/role="status"[^>]*data-page-status|data-page-status[^>]*role="status"/);
    expect(html()).toMatch(/role="region"[^>]*aria-label="Taskbar"/);
    expect(html()).toMatch(/<nav[^>]*aria-label="Desktop folders"/);
    expect(html()).toMatch(/href="#main"[^>]*>\s*Skip the desktop to the page content/);
    expect(html()).toMatch(/<main[^>]*id="main"/);
    // The main landmark is named after the page, so focusing it does not read all of its content.
    expect(html()).toMatch(new RegExp(`<main[^>]*aria-label="${h1}"`));
  });

  it("has no inline colour literals or style attributes with colours", () => {
    expect(html()).not.toMatch(/style="[^"]*(#[0-9a-f]{3,8}|rgb|hsl)/i);
  });

  it("points every in-page link at an element that exists", () => {
    const ids = new Set([...html().matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    for (const target of [...html().matchAll(/\bhref="#([^"]+)"/g)].map((m) => m[1])) {
      expect(ids.has(target), `#${target}`).toBe(true);
    }
  });

  it("hides decorative chrome from assistive technology", () => {
    for (const className of ["icon", "menu-bar"]) {
      for (const [tag] of html().matchAll(
        new RegExp(`<\\w+[^>]*class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*>`, "g"),
      )) {
        expect(tag, className).toContain('aria-hidden="true"');
      }
    }
  });
});

describe("section pages", () => {
  it.each(sectionRoutes)("$path opens the browser window with the real address", ({ path }) => {
    const html = pages[path] as string;
    expect(html).toMatch(/<div[^>]*id="browser"[^>]*role="group"/);
    expect(html).toMatch(/<label[^>]*for="browser-address"[^>]*>Address<\/label>/);
    const address = /<input[^>]*id="browser-address"[^>]*>/.exec(html)?.[0] ?? "";
    expect(address).toContain("readonly");
    expect(address).toContain(`value="https://wamae.github.io${path}"`);
    expect(html).toMatch(/<button[^>]*id="browser-back"[^>]*disabled/);
    expect(html).toMatch(/<button[^>]*id="browser-forward"[^>]*disabled/);
    expect(html).toMatch(new RegExp(`class="task-button"[^>]*href="${path}"`));
    // The main landmark is inside the browser window.
    expect(html.indexOf('id="browser"')).toBeLessThan(html.indexOf("<main"));
  });

  it("no longer says that content is a placeholder or comes later", () => {
    for (const route of routes) {
      expect(pages[route.path], route.path).not.toMatch(/placeholder|later milestone/i);
    }
  });

  it("shows the owner email on the contact page as a mailto link", () => {
    expect(pages["/contact/"]).toContain('href="mailto:integration@example.invalid"');
  });

  it("shows every desktop icon as a real link with the script hook, and Work Experience too", () => {
    const desktop =
      /<nav[^>]*aria-label="Desktop folders"[\s\S]*?<\/nav>/.exec(pages["/"] as string)?.[0] ?? "";
    const links = [...desktop.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toMatch(/href="\/[a-z-]+\/"/);
      expect(link).toContain("data-desktop-icon");
    }
    expect(desktop).toContain('href="/experience/"');
  });

  it("shows Program Manager and File Manager content with links to real pages", () => {
    expect(pages["/program-manager/"]).toMatch(
      /<a[^>]*class="program-icon[^"]*"[^>]*href="\/experience\/"/,
    );
    expect(pages["/file-manager/"]).toMatch(/<nav[^>]*aria-labelledby="tree-title"/);
    expect(pages["/file-manager/"]).toContain('href="/projects/"');
  });
});

describe("window controls", () => {
  const tagsOf = (html: string, pattern: RegExp) => [...html.matchAll(pattern)].map((m) => m[0]);

  it.each(sectionRoutes)("$path has Minimize, Maximize and Close, named", ({ path }) => {
    const html = pages[path] as string;
    const buttons = tagsOf(html, /<button\b[^>]*data-window-action="[a-z]+"[^>]*>/g);
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toContain('aria-label="Minimize"');
    expect(buttons[1]).toContain('aria-label="Maximize"');
    expect(buttons[2]).toContain('aria-label="Close"');
    for (const button of buttons) expect(button).toContain('type="button"');
    // Without a script the Close control is a plain link to the desktop.
    const links = tagsOf(html, /<a\b[^>]*class="control[^"]*"[^>]*>/g);
    expect(links).toHaveLength(1);
    expect(links[0]).toContain('href="/"');
    expect(links[0]).toContain('aria-label="Close"');
  });

  it.each(sectionRoutes)("$path has script-only controls that start hidden", ({ path }) => {
    const html = pages[path] as string;
    expect(html).toMatch(/<button[^>]*data-audience="script"[^>]*data-window-action="minimize"/);
    expect(html).toMatch(/<button[^>]*data-audience="script"[^>]*data-window-action="maximize"/);
    expect(html).toMatch(/<button[^>]*data-task-window[^>]*aria-pressed="true"/);
    // The script-only parts are hidden by a rule that needs the js class the script sets.
    expect(html).toContain("data-audience");
    expect(html).not.toMatch(/<html[^>]*class="[^"]*\bjs\b/);
  });

  it.each(sectionRoutes)(
    "$path has a task button that is a link until the script runs",
    ({ path }) => {
      expect(pages[path]).toMatch(
        new RegExp(`<a[^>]*class="task-button"[^>]*data-audience="plain"[^>]*href="${path}"`),
      );
    },
  );

  it.each(sectionRoutes)(
    "$path has a scrollable client area that a keyboard can reach",
    ({ path }) => {
      const html = pages[path] as string;
      const client = /<div[^>]*data-scroll-client[^>]*>/.exec(html)?.[0] ?? "";
      expect(client).toContain('role="group"');
      expect(client).toContain('tabindex="0"');
      expect(client).toMatch(/aria-label="[^"]+ content"/);
      expect(client).toMatch(/class="[^"]*nt-scroll/);
      expect(html.match(/data-scroll-client/g)).toHaveLength(1);
    },
  );

  it("shows no title bar controls on the welcome window or the programs inside the browser", () => {
    for (const path of ["/", "/program-manager/", "/file-manager/"]) {
      const html = pages[path] as string;
      expect(html).not.toContain("control-box");
      if (path === "/") expect(html).not.toContain("data-window-action");
    }
    expect(pages["/"]).not.toContain('class="controls"');
  });
});

describe("animations", () => {
  it.each(routes)("$path has the Animations toggle, shown only by the script", ({ path }) => {
    const html = pages[path] as string;
    const toggle = /<button[^>]*data-animations-toggle[^>]*>/.exec(html)?.[0] ?? "";
    expect(toggle).toContain('data-audience="script"');
    expect(toggle).toContain('aria-label="Animations"');
    expect(toggle).toContain('aria-pressed="true"');
    expect(toggle).toContain('type="button"');
    expect(html.match(/data-animations-toggle/g)).toHaveLength(1);
    // The toggle sits in the taskbar, after the window buttons and before the clock.
    expect(html.indexOf("data-animations-toggle")).toBeLessThan(html.indexOf("data-clock"));
    expect(html.indexOf("data-animations-toggle")).toBeGreaterThan(
      html.indexOf('data-swap="task-windows"'),
    );
  });

});

describe("the desktop home page", () => {
  it("has no browser window, only the welcome window with the owner name as h1", () => {
    expect(pages["/"]).not.toContain('id="browser"');
    expect(pages["/"]).toMatch(/id="welcome"/);
    expect(pages["/"]).not.toContain("task-button");
  });
});

describe("whole build", () => {
  it("serves the licence files for the self-hosted assets", async () => {
    expect(await site.listFiles("licenses")).toEqual(
      expect.arrayContaining(["pixelify-sans-OFL.txt", "pixelarticons-MIT.txt"]),
    );
  });

  it("ships the enhancement script as the only script, with no inline handlers", () => {
    for (const route of routes) {
      const html = pages[route.path] as string;
      expect(html).not.toMatch(/\son[a-z]+="/i);
      expect(html.match(/<script[\s>]/g)?.length ?? 0).toBeLessThanOrEqual(1);
    }
  });
});
