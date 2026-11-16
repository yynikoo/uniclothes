// Home page: shows a short loading animation, then "Hello Latvia 🇱🇻".
// The Latvian flag is also drawn as an inline SVG because Windows doesn't render flag emoji.
const flagSvg = `<svg class="flag" viewBox="0 0 20 10" aria-hidden="true">
  <rect width="20" height="10" fill="#9E3039"/>
  <rect y="4" width="20" height="2" fill="#fff"/>
</svg>`;

export function renderHome() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>uniclothes</title>
  <style>
    :root { --red: #9E3039; --bg: #fdf8f8; --fg: #1d1d1f; }
    @media (prefers-color-scheme: dark) { :root { --bg: #151213; --fg: #f4f1f1; } }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: var(--bg); color: var(--fg);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .loader { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .spinner {
      width: 48px; height: 48px; border-radius: 50%;
      border: 5px solid color-mix(in srgb, var(--red) 20%, transparent);
      border-top-color: var(--red); animation: spin .8s linear infinite;
    }
    .hello { display: none; text-align: center; padding: 0 16px; animation: pop .5s ease-out; }
    .hello h1 { font-size: clamp(2.2rem, 8vw, 4.5rem); margin: 0 0 16px; }
    .flag { width: 160px; height: 80px; border-radius: 6px; box-shadow: 0 6px 20px rgb(0 0 0 / .15); }
    body.ready .loader { display: none; }
    body.ready .hello { display: block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pop { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: none; } }
  </style>
</head>
<body>
  <div class="loader" role="status">
    <div class="spinner"></div>
    <div>Loading…</div>
  </div>
  <main class="hello">
    <h1>Hello Latvia 🇱🇻</h1>
    ${flagSvg}
  </main>
  <script>setTimeout(() => document.body.classList.add("ready"), 1500);</script>
  <noscript><style>.loader{display:none}.hello{display:block}</style></noscript>
</body>
</html>`;
}
