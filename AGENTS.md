# AGENTS.md — context for future sessions

## Stack
- Node.js 20+, ES modules, Express 4.
- Hosted on Vercel (zero-config Express: `server.js` default-exports the app).
- Tests: built-in `node:test` (`npm test`). Build check: `npm run build` (syntax check).

## Layout
- `server.js` — Express app and routes; listens on `PORT` locally, exported for Vercel.
- `src/page.js` — HTML for the home page (inline CSS/JS, no static folder).
- `test/` — `node:test` tests.
- `.env.example` — names of env vars (no values).

## Rules
- Never commit secrets. Put them in env vars, list names only in `.env.example`, never print/log them.
- Keep README.md (what it is, run locally, deploy) and this file up to date when structure changes.
- Don't create accounts or connect paid services (hosting, payments, databases) without asking the owner.
- Every push to `main` goes live on Vercel, so `main` must always build.
- Before every push: install deps if changed, run `npm run build` and `npm test` (must pass),
  check `git status` and stage only intended files (no `.env*` except `.env.example`, no build output).
- Never force-push or rewrite history on `main`. If a push is rejected: `git pull --rebase origin main`,
  fix conflicts, rebuild, push again.
