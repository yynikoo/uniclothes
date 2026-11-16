# uniclothes

A small Node.js (Express) website. Right now it shows a short loading animation and then "Hello Latvia 🇱🇻".

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev     # or: npm start
```

Open http://localhost:3000.

Checks: `npm run build` and `npm test`.

## Deploy (Vercel)

1. Import the GitHub repo `yynikoo/uniclothes` in Vercel.
2. Framework preset: **Express** (auto-detected). No build or output settings needed.
3. Environment variables: none required yet. See `.env.example` for the list.

Every push to `main` deploys to production, so `main` must always build.
