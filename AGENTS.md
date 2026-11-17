# AGENTS.md — context for future sessions

## Stack
- Node.js 22.x, ES modules, Express 4.
- Hosted on Vercel. `vercel.json` builds `server.js` with `@vercel/node` and routes every path to it (no static output dir).
- Tests: built-in `node:test` (`npm test`). Build check: `npm run build` (syntax check).

## Layout
- `server.js` — Express app and routes (`/`, `/market`, `/about`, `/contact`, `/register`, `/cart`, `/health`, `/favicon-light.svg`, `/favicon-dark.svg`, `/products/*`, `POST /shield/verify`); listens on `PORT` locally, exported for Vercel. Favicons are the logo recoloured black/white.
- `src/page.js` — shared layout, home page, placeholder pages (inline CSS/JS, no static folder). Navbar is "liquid glass": fully transparent, backdrop blur, plus an SVG displacement filter (Chromium only, enabled via `html.liquid`). Owner wants NO extra colours, outlines or shadows on it. Navbar shows logo + "UNICLOTHES" wordmark (hidden under 600px) and a theme toggle: light/dark saved in localStorage `theme` (falls back to system), applied as `html[data-theme]` before paint, favicon swapped to match, circular reveal via View Transition. Tab switching uses cross-document View Transitions (`@view-transition`): the active `.pill` slides between tabs and page content fades.
- `src/shield.js` — own bot/flood protection (Cloudflare Turnstile was removed at the owner's request). Per-IP in-memory rate limit (always on; per instance on Vercel). Proof-of-work gate when `SHIELD_SECRET` is set: page requests without a valid `uc_pass` cookie get `renderCheck` (page.js); browser finds a nonce so sha256(`challenge:nonce`) has `SHIELD_DIFFICULTY` (default 18) leading zero bits; `POST /shield/verify` checks it and sets an HMAC-signed, IP-bound HttpOnly cookie (1 day).
- `src/sha256.js` — SHA-256 + zero-bit helper as source strings shipped to the browser for the puzzle (tested against Node crypto).
- `src/home.js` — home page from the owner's mockup, ALWAYS white theme (`forceTheme: "light"` in layout → `html[data-force-theme]`, toggle hidden). Desktop drawn on a 1920×1080 grid with `--u` (1/1920 vw); stacked + swipeable cards under 900px. 5 price cards (official vs unishop) with mouse parallax, hover tilt, price drop count-down; animated Latvia SVG map (outline draws, routes from Rīga, moving dots, hover cities). Product photos: `public/products/<photo>.(webp|avif|png|jpg|jpeg)` (names in `products`), else SVG drawings.
- `public/products/` — product photos, served at `/products/*` by Express and bundled on Vercel via `includeFiles` in vercel.json.
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
