# wamae.github.io

Personal professional website of Benson Wamae, with a Windows NT 3.1 retro theme. The theme reflects one of the first times I interacted with a computer; It was on an Intel Pentium I desktop. 

The website is built with Astro and TypeScript as a fully static site and hosted on GitHub Pages at <https://wamae.github.io>.

## Setup

Requires Node.js 24.16 or later in the 24 line, or Node.js 26.3 or later (the Astro ESLint plugin needs these).

```sh
npm ci
```

## Run on localhost

```sh
npm run local
```

The first time, it asks for your name and email, writes them to `.env`, and starts the dev server at <http://localhost:4321>. After that, `npm run local` starts the server straight away. The page reloads when you save a file. Stop the server with Ctrl+C.

- `npm run setup:env` only (re)creates `.env`. Add `--force` after `--` to replace an existing one: `npm run setup:env -- --force`.
- To create `.env` by hand instead: `cp .env.example .env`, then set both values.
- To check the production build locally: `npm run build && npm run preview`, then open <http://localhost:4321>.

The build fails if either value is missing, empty, malformed or still the placeholder from `.env.example`. `.env` is never committed. Values end up in the built site, so they are public.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run check` | Type check (`astro check`) |
| `npm run lint` / `npm run format` | ESLint / Prettier (`format:check` only checks) |
| `npm run test:unit` | Unit tests (Vitest, next to the code in `src/`) |
| `npm run test:integration` | Integration tests (Vitest, `tests/integration/`, runs a real build) |
| `npm run test:e2e` | End-to-end tests (Playwright, Chromium, `tests/e2e/`). Builds and serves the production site itself. First run needs `npx playwright install chromium` |
| `npm test` | Unit, integration and end-to-end tests |

## Structure

| Folder | Holds |
|---|---|
| `src/styles/` | `tokens.css` (VGA palette and semantic tokens) and `global.css` |
| `src/design/` | Contrast maths and the approved colour pairs, with unit tests |
| `src/components/` | Design-system components (window, panel, button, menu bar, status bar, program icon, icon) and the desktop parts (desktop icon, taskbar, Start menu, browser window) |
| `src/layouts/` | The desktop layout every page uses |
| `content/` | `cv.yml`, the one file that holds all the site's CV content |
| `src/content/` | The YAML loader and validator, bold-marker parser, sorting and grouping, and the section views |
| `src/pages/` | One static page per route: `/`, `/about/`, `/experience/`, `/projects/`, `/contact/`, `/program-manager/`, `/file-manager/` |
| `src/shell/` | The section model, Program Manager and File Manager, and the pure logic (address bar URL, Start menu keys, history). `src/shell/client/` is the small browser script |
| `src/assets/` | Self-hosted font and icons with their licences |

Approved text and background colour pairs are listed in `src/design/approved-colour-pairs.ts`, and a test checks their contrast.

## How the site behaves

After the desktop appears, each section (About Me, Work Experience, Projects, Contact, plus Program Manager and File Manager) is its own real page. Every page shows the same desktop with a taskbar and a Start menu. A section page also shows a browser window with the section in it and the page's real address in the address bar.

- Without JavaScript the pages, the Start menu (a native disclosure) and all links work. Back and Forward in the browser window are disabled.
- The page changes are announced through a hidden status region, and focus moves to the page. Two skip links go to the page content and to the Start menu.
- With JavaScript, opening a section from an icon or the Start menu loads the page into the browser window without a full reload, and Back, Forward and the browser's own back button work. On any failure it falls back to a normal page load.
- Desktop icons are real links. Without JavaScript a single click opens them. With JavaScript a single click of a real mouse selects an icon, and a second click on the selected icon (a double click) opens it. Events that do not come from a mouse (the keyboard, touch, pen, or a plain script `click()`) open it at once. Assistive technology or voice control that emulates a real mouse reports a mouse pointer too, so it needs a second click, or Enter, to open an icon.
- Back and Forward in the browser window follow the entries the window opened. The number of entries is kept in session storage, so Forward still works after a reload in the middle of the history. If storage is blocked, Forward shows disabled after a reload, although the browser's own forward button works.
- The browser window is a normal-sized window (about 80% of the desktop width and the desktop height above the status bar, near the top left) and it keeps its size. When a page is longer or wider than the window, the content area scrolls inside it with an NT-style scroll bar, and the page itself does not grow or scroll. The content area is a named group that can take focus, so a keyboard user can Tab to it and scroll with the arrow keys, Page Up, Page Down, Home and End. Links to a place on the page scroll the content area to it, only as far as needed. On a short screen (under 30rem of height, such as 200% zoom or a phone on its side) there is no room for that, so the window is as tall as its content and the page scrolls instead; a maximized window is then fixed above the taskbar and its content scrolls inside it.
- The title bar has Minimize, Maximize (Restore) and Close buttons. Maximize makes the window fill the desktop above the status bar, and the same button, now named Restore, puts it back. Double-clicking the title bar does the same. A maximized window stays maximized through Minimize and restore, and when another section opens, and it is normal size again after Close and reopen. On a phone (under 40rem wide) the window always fills the desktop, so there is no Maximize button and the double click does nothing.
- Close returns to the empty desktop (the home page) and adds a history entry, so the browser's Back reopens the section. Minimize hides the window to its taskbar button, which stays and shows as raised. Selecting that button restores the window with the same content, address and scroll position inside the window, and selecting it while the window shows minimizes it. Opening anything (a desktop icon, a Start menu item, a link) or using Back or Forward while minimized brings the window back. Minimizing changes neither the address nor the history. The buttons work by mouse, touch and keyboard, and changes ("Projects minimized", "restored", "maximized", "closed") are announced to screen readers.
- Without JavaScript there is no Minimize or Maximize button, Close is a plain link to the desktop, and the window keeps its default size with its content scrolling inside. The script shows its buttons only after it has set up everything, so a failure leaves the plain link and nothing dead. The state is not saved: after a reload the window is open, at normal size, showing the section in the address.
- The site is served from the root of its origin, so `site` in `astro.config.mjs` must not have a base path.

### Animations

All animations are decorative extras. Nothing waits for them, none takes focus, and the site works the same with them off. They are written in plain CSS and TypeScript with the browser's own Web Animations API and Canvas 2D, with no library.

- **Zoom outlines.** Opening a window from a desktop folder or a Start menu item, closing it, minimizing it to its taskbar button, restoring it and maximizing or restoring it draw a dotted rectangle that jumps in eight steps (about a quarter of a second) between where the window was and where it goes, as Windows NT 3.1 did. It is drawn over the page and is hidden from assistive technology.
- **Program Manager cascade.** The group windows of Program Manager appear one after another in a few steps.
- **Hourglass.** An hourglass cursor, drawn for this site, shows while a page loads. With animations on, a fast load still keeps it for a short moment (300 ms) so it can be seen. The page is shown at once and is never held back.
- **Screen saver.** A Mystify-style saver (two bouncing shapes with trails) starts after 90 seconds without a key, mouse, touch or scroll, or from Start, Screen Saver. Any key, mouse move, click, touch or wheel stops it, and that first action is not passed on to the page. A saver that you start yourself is announced to screen readers, one that starts by itself is not and never moves focus.
- **Animations button.** The taskbar tray has an Animations button, shown only with JavaScript, that turns all of this off or on. The choice is kept in this browser (local storage). When your device asks for reduced motion, the button is switched off and says so ("Animations off: your device asks for reduced motion"), animations stay off, the Screen Saver item is not offered, and the saver never starts by itself. Without JavaScript nothing animates and none of these controls appear.
- On the page, `data-animations` (on or off), `data-animating` (while an outline is drawn), `data-busy`, and `data-screensaver` show the state, which the tests use.

To try it by hand, run the site (see Run on localhost), open a folder, minimize, restore and maximize the window, open Program Manager from the Start menu, leave the page alone for 90 seconds or choose Start, Screen Saver, and flip the Animations button. The manual test script (a local document) lists each animation for Chrome, Firefox and Safari.

## Editing the content

All CV content is in one commented YAML file, **`content/cv.yml`**: the headline, summary (first person), key skills, roles, projects, education, certifications and links. It is public content and is published with the site. The comments at the top of the file explain every section, the date formats, the industry list and the rules below. The owner name and email still come from `.env`.

To change the site: edit `content/cv.yml`, commit and push to `main`. The Deploy workflow builds the site from the file and publishes it, so nothing else needs changing. Locally, `npm run dev` reloads when the file is saved, and `npm run build` fails if the file is wrong.

- **Roles** have an `id`, `employer`, `title`, `start` and `end` (each `2012` or `2012-03`; write `end: null` for a role that is still going) and optional `description` and `highlights`.
- **Projects** have an `id`, the `roleId` of their role, a `title`, exactly one `industry` from the fixed list (Fintech, Banking, Staffing, IoT, Public sector / data collection, Agriculture), a `description` and optional `results`. A project takes the dates of its role unless it has its own `start` and `end`.
- **Industries without a project** are not listed in the By industry index. Agriculture is in the fixed list but has no project yet; adding a project with that industry is all it needs to appear.
- **Order** is never set by hand. Roles and projects are sorted newest first in code: later end date first (an ongoing role is newest), then later start date. Entries with the same dates keep the order of the file, so write the projects of a role in the order you want them shown. A year-only start counts as January and a year-only end as December. Overlapping roles are all shown.
- **Bold figures:** write `**` on both sides of a figure, for example `**80%**`, in the summary, descriptions, highlights and results. It becomes a real bold element. No spaces just inside the markers, no nesting, no empty pair and no other asterisks, or the build fails. Bold is not allowed in titles, names, skills or links.
- **YAML quoting:** text that starts with `*`, `&`, `!`, `|`, `>`, `%`, `@`, `#`, `-`, `?`, `[`, `{` or `,`, or that contains a colon and a space (`: `), needs quotes. For example `"**3X** more revenue"` (a bold marker at the start needs quotes, because YAML reads a bare `*` as an alias).
- **Results are percentages only.** A text field fails the build if it holds a currency symbol (any Unicode currency sign), a currency code in its own case such as USD or KES (also when it touches digits, as in USD500), "Sh" or "Shs" before an amount, "/=" after an amount, or a currency name as a whole word (dollars, shillings, euros, pounds, naira, rupees). Invisible characters are ignored when checking. The check runs on the text without the bold markers. Percentages and multiples such as 3X are fine.
- **Validation** runs on every build and fails with one message that lists every problem with its field and line, for example `roles[3].end: must be a date such as 2012 or 2012-03 ... (line 52)`. It checks: YAML syntax (with the parser's line and column), duplicate keys, unknown fields, unknown role id, unknown industry, bad dates, empty text, duplicate ids, a project without exactly one industry, bold markers, currency, and links that are not https. Aliases (`*name`) and tags that build non-plain values are rejected.
- **Parser:** the file is read with [js-yaml](https://github.com/nodeca/js-yaml) in its safe mode.

## Deploy

A push to `main` (or a manual run of the Deploy workflow) runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages.

> **Before merging to `main`, the owner must do two things in the repository settings.** If step 1 is skipped, GitHub's legacy Jekyll build will publish the repository root (the README and docs) in place of the current site. If step 2 is skipped, the deploy build fails.
>
> 1. **Settings > Pages > Source: set it to "GitHub Actions".** The live site at <https://wamae.github.io> is currently on the legacy build source (the old template), so it will not switch by itself.
> 2. **Settings > Secrets and variables > Actions > Variables: add `PUBLIC_OWNER_NAME` and `PUBLIC_OWNER_EMAIL`.** Deploy fails if they are unset. CI uses clearly fake fallback values when they are unset.
