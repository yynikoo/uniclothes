import express from "express";
import { renderHome, renderPlaceholder, renderCheck, placeholderPages } from "./src/page.js";
import { logoSvg } from "./src/logo.js";
import { shieldGate, rateLimit, verifyHandler } from "./src/shield.js";

const app = express();

// UNICLOTHES shield: per-IP rate limit always; proof-of-work check when SHIELD_SECRET is set.
app.post("/shield/verify", rateLimit("verify"), express.json({ limit: "2kb" }), verifyHandler);
app.use(rateLimit("page"));
app.use(shieldGate(renderCheck));

// Favicons: the logo in black (light theme) or white (dark theme). Pages pick one to match the theme.
const favicon = (color) =>
  logoSvg
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(' width="26" height="26"', "")
    .replace('fill="currentColor"', `fill="${color}"`)
    .replace(' aria-hidden="true"', "");
const favicons = { light: favicon("#000000"), dark: favicon("#ffffff") };

for (const [theme, svg] of Object.entries(favicons)) {
  app.get(`/favicon-${theme}.svg`, (_req, res) => {
    res.set("Cache-Control", "public, max-age=86400").type("image/svg+xml").send(svg);
  });
}
app.get("/favicon.ico", (_req, res) => res.redirect(301, "/favicon-light.svg"));

app.get("/", (_req, res) => {
  res.type("html").send(renderHome());
});

for (const path of Object.keys(placeholderPages)) {
  app.get(path, (_req, res) => {
    res.type("html").send(renderPlaceholder(path));
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// On Vercel the app is exported and run as a function; locally we listen on a port.
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`uniclothes running at http://localhost:${port}`);
  });
}

export default app;
