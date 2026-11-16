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
3. Environment variables: see `.env.example`. None are required for the site to run.

### Cloudflare check (optional)

Visitors see a Cloudflare Turnstile "Checking you're human" page before the site, once a day.
It is off until both keys are set:

1. In the Cloudflare dashboard, open **Turnstile → Add widget**. Add your Vercel domain(s) and `localhost`.
2. In Vercel → Settings → Environment Variables, add `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`
   (mark the secret as Sensitive), then redeploy.

To try it locally, use Cloudflare's public test keys (they always pass):

```bash
TURNSTILE_SITE_KEY=1x00000000000000000000AA TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA npm start
```

Every push to `main` deploys to production, so `main` must always build.
