# AGENTS.md — context for future sessions

## Stack
- Node.js 22.x, ES modules, Express 4.
- Hosted on Vercel. `vercel.json` builds `server.js` with `@vercel/node` and routes every path to it (no static output dir).
- Tests: built-in `node:test` (`npm test`). Build check: `npm run build` (syntax check).

## Layout
- `server.js` — Express app and routes (`/`, `/market`, `/about`, `/contact`, `/register`, `/cart`, `/health`); listens on `PORT` locally, exported for Vercel.
- `src/page.js` — shared layout (glass navbar: transparent + backdrop blur), home page, placeholder pages (inline CSS/JS, no static folder).
- `src/logo.js` — logo as inline SVG (`currentColor`), generated from `assets/logo-source.svg`.
- `assets/` — original design files (not served).
- `.claude/launch.json` — local preview config (`npm start` on port 3000).
- `test/` — `node:test` tests.
- `.env.example` — names of env vars (no values).
- `vercel.json` — Vercel build + routing config.

## Rules
- Never commit secrets. Put them in env vars, list names only in `.env.example`, never print/log them.
- Keep README.md (what it is, run locally, deploy) and this file up to date when structure changes.
- Don't create accounts or connect paid services (hosting, payments, databases) without asking the owner.
- Every push to `main` goes live on Vercel, so `main` must always build.
- Before every push: install deps if changed, run `npm run build` and `npm test` (must pass),
  check `git status` and stage only intended files (no `.env*` except `.env.example`, no build output).
- Never force-push or rewrite history on `main`. If a push is rejected: `git pull --rebase origin main`,
  fix conflicts, rebuild, push again.
