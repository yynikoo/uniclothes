// Page HTML for the site: a shared layout with a glass (transparent + blur) navbar,
// the home page (loading animation, then "Hello Latvia 🇱🇻"), and simple placeholder pages.
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

const styles = `
  :root {
    --bg: #ffffff; --fg: #111111; --muted: #6b6b6b;
    --btn-bg: #000000; --btn-fg: #ffffff;
    --glass-border: rgb(0 0 0 / .10); --glass-shadow: 0 8px 30px rgb(0 0 0 / .08);
    --red: #9E3039;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0e0e0f; --fg: #f4f4f5; --muted: #a1a1aa;
      --btn-bg: #ffffff; --btn-fg: #000000;
      --glass-border: rgb(255 255 255 / .14); --glass-shadow: 0 8px 30px rgb(0 0 0 / .4);
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; background: var(--bg); color: var(--fg);
    font-family: "Prompt", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  a { color: inherit; text-decoration: none; }

  /* Glass navbar: fully transparent background, blurs whatever scrolls under it. */
  .nav {
    position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 10;
    width: min(720px, calc(100% - 32px));
    display: flex; align-items: center; gap: 16px;
    padding: 6px 10px 6px 12px; border-radius: 999px;
    background: transparent;
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    backdrop-filter: blur(16px) saturate(160%);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
  }
  .nav-logo { display: flex; align-items: center; flex: none; }
  .nav-links { display: flex; gap: 16px; overflow-x: auto; scrollbar-width: none; min-width: 0; }
  .nav-links::-webkit-scrollbar { display: none; }
  .nav-links a { font-size: 1.25rem; white-space: nowrap; line-height: 1.6; }
  .nav-links a:hover, .nav-links a[aria-current="page"] { text-decoration: underline; text-underline-offset: 4px; }
  .nav-actions { display: flex; gap: 8px; margin-left: auto; flex: none; }
  .btn {
    background: var(--btn-bg); color: var(--btn-fg);
    font-size: .85rem; font-weight: 500; padding: 4px 12px; border-radius: 999px; white-space: nowrap;
  }
  .btn:hover { opacity: .85; }
  @media (max-width: 600px) {
    .nav { gap: 10px; padding: 6px 8px 6px 10px; }
    .nav-links { gap: 12px; }
    .nav-links a { font-size: 1rem; }
    /* Links scroll sideways on small screens; fade the edge so that's visible. */
    .nav-links { mask-image: linear-gradient(to right, #000 85%, transparent); padding-right: 16px; }
    .btn { font-size: .8rem; padding: 4px 10px; }
  }

  main { min-height: 100vh; display: grid; place-items: center; padding: 96px 16px 32px; text-align: center; }
  h1 { font-size: clamp(2.2rem, 8vw, 4.5rem); margin: 0 0 16px; font-weight: 600; }
  .muted { color: var(--muted); }

  /* Home loading animation */
  .loader { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .spinner {
    width: 48px; height: 48px; border-radius: 50%;
    border: 5px solid color-mix(in srgb, var(--red) 20%, transparent);
    border-top-color: var(--red); animation: spin .8s linear infinite;
  }
  .hello { display: none; animation: pop .5s ease-out; }
  .flag { width: 160px; height: 80px; border-radius: 6px; box-shadow: 0 6px 20px rgb(0 0 0 / .15); }
  body.ready .loader { display: none; }
  body.ready .hello { display: block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pop { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: none; } }
`;

function nav(currentPath) {
  const links = navLinks
    .map(({ href, label }) => {
      const current = href === currentPath ? ' aria-current="page"' : "";
      return `<a href="${href}"${current}>${label}</a>`;
    })
    .join("");
  return `<header class="nav">
    <a class="nav-logo" href="/" aria-label="uniclothes home">${logoSvg}</a>
    <nav class="nav-links" aria-label="Main">${links}</nav>
    <div class="nav-actions">
      <a class="btn" href="/register">Register</a>
      <a class="btn" href="/cart">Cart</a>
    </div>
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
</head>
<body>
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
  <script>setTimeout(() => document.body.classList.add("ready"), 1500);</script>
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
