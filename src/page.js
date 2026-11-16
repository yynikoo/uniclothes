// Page HTML for the site: a shared layout with a "liquid glass" navbar,
// the home page (loading animation, then "Hello Latvia 🇱🇻"), and simple placeholder pages.
//
// Liquid glass: the navbar is see-through, blurs what's behind it and (in Chromium browsers)
// bends it with an SVG displacement filter. Other browsers get the plain blur.
// Tab switching: cross-page View Transitions slide the active "pill" from the old tab to the new
// one and fade the page content. Browsers without View Transitions just load the page normally.
import { logoSvg } from "./logo.js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/market", label: "Market" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact Us" },
];

// The Latvian flag is also drawn as SVG because Windows doesn't render flag emoji.
const flagSvg = `<svg class="flag" viewBox="0 0 20 10" aria-hidden="true">
  <rect width="20" height="10" fill="#9E3039"/>
  <rect y="4" width="20" height="2" fill="#fff"/>
</svg>`;

// Distortion filter used by the navbar's backdrop. The noise drifts slowly so the glass looks liquid.
const liquidFilterSvg = `<svg class="defs" aria-hidden="true" focusable="false">
  <filter id="liquid-glass" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="2" seed="4" result="noise">
      <animate attributeName="baseFrequency" dur="14s" repeatCount="indefinite"
        values="0.006 0.018; 0.009 0.014; 0.006 0.018"/>
    </feTurbulence>
    <feGaussianBlur in="noise" stdDeviation="2.5" result="softNoise"/>
    <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="38" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>`;

const styles = `
  @view-transition { navigation: auto; }

  :root {
    --bg: #ffffff; --fg: #111111; --muted: #6b6b6b;
    --btn-bg: #000000; --btn-fg: #ffffff;
    --pill-bg: rgb(0 0 0 / .07);
    --red: #9E3039;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b0b0c; --fg: #f4f4f5; --muted: #a1a1aa;
      --btn-bg: #ffffff; --btn-fg: #000000;
      --pill-bg: rgb(255 255 255 / .12);
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; background: var(--bg); color: var(--fg);
    font-family: "Prompt", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    overflow-x: hidden;
  }
  a { color: inherit; text-decoration: none; }
  .defs { position: absolute; width: 0; height: 0; overflow: hidden; }

  /* ---------- Liquid glass navbar ---------- */
  .nav {
    position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 10;
    width: min(740px, calc(100% - 32px));
    display: flex; align-items: center; gap: 14px;
    padding: 6px 8px 6px 12px; border-radius: 999px;
    isolation: isolate; view-transition-name: nav;
    background: transparent;
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    backdrop-filter: blur(14px) saturate(180%);
  }
  /* Chromium: bend the backdrop through the SVG filter for the liquid distortion. */
  html.liquid .nav {
    -webkit-backdrop-filter: url(#liquid-glass) blur(3px) saturate(190%);
    backdrop-filter: url(#liquid-glass) blur(3px) saturate(190%);
  }
  .nav-logo { display: flex; align-items: center; flex: none; transition: transform .3s cubic-bezier(.34,1.56,.64,1); }
  .nav-logo:hover { transform: rotate(-8deg) scale(1.08); }

  .nav-links { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; min-width: 0; }
  .nav-links::-webkit-scrollbar { display: none; }
  .nav-links a {
    position: relative; font-size: 1.2rem; white-space: nowrap; line-height: 1.6;
    padding: 2px 12px; border-radius: 999px;
    transition: transform .25s cubic-bezier(.34,1.56,.64,1), background-color .2s;
  }
  .nav-links a:hover { background: color-mix(in srgb, var(--pill-bg) 60%, transparent); }
  .nav-links a:active { transform: scale(.94); }
  .nav-links a > span { position: relative; z-index: 1; }

  /* The active tab's glass pill. It has a view-transition-name, so on navigation the browser
     slides it from the old tab to the new one. */
  .pill {
    position: absolute; inset: 0; border-radius: inherit; z-index: 0;
    view-transition-name: nav-pill;
    background: var(--pill-bg);
  }

  .nav-actions { display: flex; gap: 6px; margin-left: auto; flex: none; }
  .btn {
    background: var(--btn-bg); color: var(--btn-fg);
    font-size: .85rem; font-weight: 500; padding: 5px 13px; border-radius: 999px; white-space: nowrap;
    transition: transform .25s cubic-bezier(.34,1.56,.64,1);
  }
  .btn:hover { transform: translateY(-1px) scale(1.04); }
  .btn:active { transform: scale(.94); }
  .btn[aria-current="page"] { outline: 2px solid var(--btn-bg); outline-offset: 2px; }

  @media (max-width: 600px) {
    .nav { gap: 8px; padding: 6px 6px 6px 10px; }
    .nav-links a { font-size: 1rem; padding: 2px 9px; }
    .btn { font-size: .8rem; padding: 4px 10px; }
    /* Links scroll sideways on small screens; fade the edge so that's visible. */
    .nav-links { mask-image: linear-gradient(to right, #000 85%, transparent); padding-right: 16px; }
  }

  /* ---------- Tab-switch animation (View Transitions) ---------- */
  ::view-transition-group(nav) { animation: none; }
  ::view-transition-old(nav), ::view-transition-new(nav) { animation: none; }
  ::view-transition-group(nav-pill) {
    animation-duration: .5s;
    animation-timing-function: cubic-bezier(.34,1.4,.64,1); /* slight overshoot = liquid wobble */
  }
  ::view-transition-old(root) { animation: page-out .22s ease-in both; }
  ::view-transition-new(root) { animation: page-in .38s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes page-out { to { opacity: 0; transform: translateY(-8px); filter: blur(4px); } }
  @keyframes page-in { from { opacity: 0; transform: translateY(12px); filter: blur(6px); } }

  @media (prefers-reduced-motion: reduce) {
    @view-transition { navigation: none; }
    *, *::before, *::after { transition: none !important; }
  }

  /* ---------- Page content ---------- */
  main { position: relative; z-index: 1; min-height: 100vh; display: grid; place-items: center; padding: 96px 16px 32px; text-align: center; }
  h1 { font-size: clamp(2.2rem, 8vw, 4.5rem); margin: 0 0 16px; font-weight: 600; }
  .muted { color: var(--muted); }

  /* Home loading animation (first visit in a session only) */
  .loader { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .spinner {
    width: 48px; height: 48px; border-radius: 50%;
    border: 5px solid color-mix(in srgb, var(--red) 20%, transparent);
    border-top-color: var(--red); animation: spin .8s linear infinite;
  }
  .hello { display: none; animation: pop .5s ease-out; }
  .flag { width: 160px; height: 80px; border-radius: 6px; box-shadow: 0 6px 20px rgb(0 0 0 / .15); }
  html.ready .loader { display: none; }
  html.ready .hello { display: block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pop { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: none; } }
`;

// Runs in <head> before first paint: turns on the liquid filter in Chromium (other engines
// don't support SVG filters in backdrop-filter) and skips the home loader after the first visit.
const headScript = `<script>
  (function () {
    var d = document.documentElement;
    if (window.chrome && !/Firefox/.test(navigator.userAgent)) d.classList.add("liquid");
    try { if (sessionStorage.getItem("seenLoader")) d.classList.add("ready"); } catch (e) {}
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".defs animate").forEach(function (a) { a.remove(); });
      });
    }
  })();
</script>`;

function nav(currentPath) {
  const links = navLinks
    .map(({ href, label }) => {
      const active = href === currentPath;
      return `<a href="${href}"${active ? ' aria-current="page"' : ""}>${
        active ? '<i class="pill" aria-hidden="true"></i>' : ""}<span>${label}</span></a>`;
    })
    .join("");
  const btn = (href, label) =>
    `<a class="btn" href="${href}"${href === currentPath ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="nav">
    <a class="nav-logo" href="/" aria-label="uniclothes home">${logoSvg}</a>
    <nav class="nav-links" aria-label="Main">${links}</nav>
    <div class="nav-actions">${btn("/register", "Register")}${btn("/cart", "Cart")}</div>
  </header>`;
}

function layout({ title, currentPath, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${styles}</style>
  ${headScript}
</head>
<body>
  ${liquidFilterSvg}
  ${nav(currentPath)}
  ${body}
</body>
</html>`;
}

export function renderHome() {
  return layout({
    title: "uniclothes",
    currentPath: "/",
    body: `<main>
    <div class="loader" role="status">
      <div class="spinner"></div>
      <div>Loading…</div>
    </div>
    <div class="hello">
      <h1>Hello Latvia 🇱🇻</h1>
      ${flagSvg}
    </div>
  </main>
  <script>
    if (!document.documentElement.classList.contains("ready")) {
      setTimeout(function () {
        document.documentElement.classList.add("ready");
        try { sessionStorage.setItem("seenLoader", "1"); } catch (e) {}
      }, 1500);
    }
  </script>
  <noscript><style>.loader{display:none}.hello{display:block}</style></noscript>`,
  });
}

// Placeholder pages for nav links that aren't built yet.
export const placeholderPages = {
  "/market": "Market",
  "/about": "About",
  "/contact": "Contact Us",
  "/register": "Register",
  "/cart": "Cart",
};

export function renderPlaceholder(path) {
  const title = placeholderPages[path];
  return layout({
    title: `${title} · uniclothes`,
    currentPath: path,
    body: `<main><div><h1>${title}</h1><p class="muted">Coming soon.</p></div></main>`,
  });
}
