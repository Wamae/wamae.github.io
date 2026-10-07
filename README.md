# wamae.github.io

Personal professional website of Benson Wamae, with a Windows NT 3.1 retro theme. Built with Astro and TypeScript as a fully static site and hosted on GitHub Pages at <https://wamae.github.io>.

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
| `src/content/` | The profile data file, its validator, sorting and grouping, and the section views |
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
- The site is served from the root of its origin, so `site` in `astro.config.mjs` must not have a base path.

## Editing the content

All CV content is in one data file, `src/content/profile.json`: the headline, summary (first person), key skills, roles, projects, education, certifications and links. Change it there and the pages follow, with no template edits. The owner name and email still come from `.env`.

- **Roles** have an `id`, `employer`, `title`, a `period` (`start` and `end`, each `"2012"` or `"2012-03"`; use `"end": null` for a role that is still going) and optional `description` and `highlights`.
- **Projects** have an `id`, the `roleId` of their role, a `title`, exactly one `industry` from the fixed list (Fintech, Banking, Staffing, IoT, Public sector / data collection), a `description` and optional `results`. A project takes the period of its role unless it has its own `period`.
- **Order** is never set by hand. Roles and projects are sorted newest first in code: later end date first (an ongoing role is newest), then later start date. Entries with the same period keep the order of the data file, so write the projects of a role in the order you want them shown. A year-only start counts as January and a year-only end as December. Overlapping roles are all shown.
- **Results are percentages only.** A text field fails the build if it holds a currency symbol (any Unicode currency sign), a currency code in its own case such as USD or KES (also when it touches digits, as in USD500), "Sh" or "Shs" before an amount, "/=" after an amount, or a currency name as a whole word (dollars, shillings, euros, pounds, naira, rupees). Invisible characters are ignored when checking. Percentages and multiples such as 3X are fine.
- **Validation** runs on every build. It fails with one message that lists every problem: unknown role id, unknown industry, bad date, empty field, duplicate id, a project without exactly one industry, currency, or a link that is not https.

## Deploy

A push to `main` (or a manual run of the Deploy workflow) runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages.

> **Before merging to `main`, the owner must do two things in the repository settings.** If step 1 is skipped, GitHub's legacy Jekyll build will publish the repository root (the README and docs) in place of the current site. If step 2 is skipped, the deploy build fails.
>
> 1. **Settings > Pages > Source: set it to "GitHub Actions".** The live site at <https://wamae.github.io> is currently on the legacy build source (the old template), so it will not switch by itself.
> 2. **Settings > Secrets and variables > Actions > Variables: add `PUBLIC_OWNER_NAME` and `PUBLIC_OWNER_EMAIL`.** Deploy fails if they are unset. CI uses clearly fake fallback values when they are unset.

## Documentation

Project planning and engineering documents are kept locally by the owner and are not part of this repository.
