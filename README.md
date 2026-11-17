# uniclothes

A Node.js (Express) website for the uniclothes shop. Right now it has a liquid-glass navbar (UNICLOTHES logo, Home, Market, About, Contact Us, light/dark theme toggle, Register, Cart) and a white-only home page ("Off you buy where it’s cheap", price-comparison product cards, "ONLY LATVIA" delivery note, and a "More Nike" grid of 7 shoes). The other pages are placeholders.

## Run locally

Requires Node.js 22.

```bash
npm install
npm run dev     # or: npm start
```

Open http://localhost:3000.

Checks: `npm run build` and `npm test`.

### Product photos

Put photos in `public/products/` with these names (any of .webp, .avif, .png, .jpg, .jpeg):
`nike-slide-black`, `nike-slide-white`, `asics-white-red`, `asics-black`.
Cards without a photo show a drawn illustration.

Current photos are the brands' official product images (Nike Mind 001 Flyknit Hyper Royal IR2175-400 and Light Smoke Grey HQ4307-003 from nike.com; ASICS Metaspeed Sky Tokyo 1013A162-102 and Novablast 6 1011C243-002 from asics.com; 7 Nike shoes for the "More Nike" grid from nike.com: nike-aj1-high-og, nike-air-max-dn8, nike-shox-tl, nike-air-max-95, nike-vomero-5, nike-af1-07, nike-air-max-plus).

## Deploy (Vercel)

1. Import the GitHub repo `yynikoo/uniclothes` in Vercel.
2. Leave Framework preset and build settings as they are: `vercel.json` tells Vercel to run `server.js` as a Node function.
3. Environment variables: see `.env.example`. None are required for the site to run.

### Shield: our own bot protection (optional)

Visitors see a "Checking you're human" page before the site, once a day. Their browser solves a
small puzzle (about a second), which makes mass requests expensive for bots. Every IP is also
rate-limited. No third-party service is used.

It is off until `SHIELD_SECRET` is set:

1. Make a long random secret on your own computer:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. In Vercel → Settings → Environment Variables, add `SHIELD_SECRET` with that value
   (Production only, mark it Sensitive), then redeploy.

Note: big network-level DDoS attacks are stopped by Vercel's platform before they reach this code.
For an emergency, Vercel's Firewall also has an "Attack Challenge Mode" switch.

To try it locally:

```bash
SHIELD_SECRET=local-test-secret npm start
```

Every push to `main` deploys to production, so `main` must always build.
