# wamae.github.io

Personal professional website of Wamae Benson, with a Windows NT 3.1 retro theme. Built with Astro and TypeScript as a fully static site and hosted on GitHub Pages at <https://wamae.github.io>.

## Setup

Requires Node.js 24 or later.

```sh
npm ci
cp .env.example .env   # then set PUBLIC_OWNER_NAME and PUBLIC_OWNER_EMAIL
```

The build fails if either value is missing or empty. `.env` is never committed. Values end up in the built site, so they are public.

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

A push to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. One-time repository setup:

1. Settings > Pages > Source: **GitHub Actions**.
2. Settings > Secrets and variables > Actions > Variables: add `PUBLIC_OWNER_NAME` and `PUBLIC_OWNER_EMAIL`. Deploy fails if they are unset. CI uses clearly fake fallback values when they are unset.

## Documentation

- Scope and requirements: [product/project_charter.md](product/project_charter.md)
- Engineering guide (design, testing, commits, dependencies, quality): [engineering/engineering-guide-index.md](engineering/engineering-guide-index.md)
- Working rules for Claude: [CLAUDE.md](CLAUDE.md)
