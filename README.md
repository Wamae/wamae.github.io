# wamae.github.io

Personal professional website of Wamae Benson, with a Windows NT 3.1 retro theme. Built with Astro and TypeScript as a fully static site and hosted on GitHub Pages at <https://wamae.github.io>.

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

## Deploy

A push to `main` (or a manual run of the Deploy workflow) runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages.

> **Before merging to `main`, the owner must do two things in the repository settings.** If step 1 is skipped, GitHub's legacy Jekyll build will publish the repository root (the README and docs) in place of the current site. If step 2 is skipped, the deploy build fails.
>
> 1. **Settings > Pages > Source: set it to "GitHub Actions".** The live site at <https://wamae.github.io> is currently on the legacy build source (the old template), so it will not switch by itself.
> 2. **Settings > Secrets and variables > Actions > Variables: add `PUBLIC_OWNER_NAME` and `PUBLIC_OWNER_EMAIL`.** Deploy fails if they are unset. CI uses clearly fake fallback values when they are unset.

## Documentation

- Scope and requirements: [product/project_charter.md](product/project_charter.md)
- Engineering guide (design, testing, commits, dependencies, quality): [engineering/engineering-guide-index.md](engineering/engineering-guide-index.md)
- Working rules for Claude: [CLAUDE.md](CLAUDE.md)
