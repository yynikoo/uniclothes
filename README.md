# uniclothes

A Node.js (Express) website for the uniclothes shop. Right now it has a liquid-glass navbar (UNICLOTHES logo, Home, Market, About, Contact Us, light/dark theme toggle, Register, Cart) and a home page that shows a short loading animation and then "Hello Latvia 🇱🇻". The other pages are placeholders.

## Run locally

Requires Node.js 22.

```bash
npm install
npm run dev     # or: npm start
```

Open http://localhost:3000.

Checks: `npm run build` and `npm test`.

## Deploy (Vercel)

1. Import the GitHub repo `yynikoo/uniclothes` in Vercel.
2. Leave Framework preset and build settings as they are: `vercel.json` tells Vercel to run `server.js` as a Node function.
3. Environment variables: none required yet. See `.env.example` for the list.

Every push to `main` deploys to production, so `main` must always build.
