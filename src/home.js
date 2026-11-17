// Home page (white theme only), built from the owner's mockup:
// left: "Off you buy where it's cheap", Browse market / Register, animated Latvia map, "ONLY LATVIA";
// right: overlapping product cards comparing the official price with the unishop price.
//
// Desktop layout is drawn on a 1920×1080 grid using the --u unit (1u = 1/1920 of the viewport
// width), so it scales like the mockup. Under 900px it switches to a stacked layout with the cards
// in a swipeable row.
//
// Product photos: put a file named `<photo>.png|jpg|jpeg|webp|avif` in public/products (see the
// `photo` names below). Cards use the photo when it exists, otherwise a drawn SVG illustration.
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const PRODUCTS_DIR = fileURLToPath(new URL("../public/products", import.meta.url));
const PHOTO_EXTENSIONS = [".webp", ".avif", ".png", ".jpg", ".jpeg"];

function findPhoto(name) {
  if (!existsSync(PRODUCTS_DIR)) return null;
  const files = readdirSync(PRODUCTS_DIR);
  for (const ext of PHOTO_EXTENSIONS) {
    const file = files.find((f) => f.toLowerCase() === name + ext);
    if (file) return `/products/${encodeURIComponent(file)}`;
  }
  return null;
}

// ---------- Products ----------
const products = [
  { id: "c1", photo: "nike-slide-black", brand: "Nike Official", retail: 130, ours: 30, art: () => slideArt("c1", { upper: "#23262d", texture: "#30343c", footbed: "#1f5bff", sole: "#1b1d22", bumps: "#2a2d34", spot: "#c6f432" }) },
  { id: "c2", photo: "chrome-hearts-tee", brand: "Chrome Hearts off", retail: 119, ours: 34, art: () => teeArt({ body: "#d9d3c8", shade: "#c9c2b6", print: "#4f9a5a" }) },
  { id: "c3", photo: "nike-slide-white", brand: "Nike Official", retail: 130, ours: 80, plain: true, art: () => slideArt("c3", { upper: "#f4f4f2", texture: "#e2e2df", footbed: "#ff7a3d", sole: "#ececea", bumps: "#dedede", spot: "#ff5a2a" }) },
  { id: "c4", photo: "asics-white-red", brand: "ASICS Official", retail: 300, ours: 40, art: () => sneakerArt({ upper: "#f1f1f1", collar: "#d8d8d8", mid: "#ffffff", sole: "#ff3b3b", accent: "#e8252b", accent2: "#ff6b5e", lace: "#cfcfcf" }) },
  { id: "c5", photo: "asics-black", brand: "Asics Official", retail: 150, ours: 45, art: () => sneakerArt({ upper: "#1d1e21", collar: "#0f1012", mid: "#2a2b2f", sole: "#111214", accent: "#9a9ca3", accent2: "#c4c6cc", lace: "#3a3b40" }) },
];

// ---------- Product illustrations ----------
function sneakerArt(c) {
  const laces = [0, 1, 2, 3, 4]
    .map((i) => {
      const x = 150 + i * 22, y = 92 + i * 3.6;
      return `<path d="M${x} ${y} l14 -9" stroke="${c.lace}" stroke-width="5" stroke-linecap="round"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 400 240" aria-hidden="true">
    <ellipse cx="208" cy="222" rx="172" ry="9" fill="rgb(0 0 0 / .10)"/>
    <path d="M38 176 C30 140 40 100 60 78 C76 64 108 62 126 72 C150 86 172 100 204 104 C252 110 302 118 342 136 C366 147 380 160 382 176 Z" fill="${c.upper}"/>
    <path d="M60 78 C76 64 108 62 126 72 L120 86 C104 78 84 80 70 92 Z" fill="${c.collar}"/>
    ${laces}
    <path d="M112 172 C146 138 200 116 266 110 L282 120 C222 128 172 150 144 174 Z" fill="${c.accent}"/>
    <path d="M150 174 C182 150 232 134 296 128 L306 136 C250 144 206 160 182 176 Z" fill="${c.accent2}"/>
    <path d="M300 148 C330 150 358 160 376 172" stroke="rgb(0 0 0 / .12)" stroke-width="3" fill="none"/>
    <path d="M30 176 L386 176 C392 188 386 204 364 208 L62 210 C40 210 26 196 30 176 Z" fill="${c.mid}" stroke="rgb(0 0 0 / .06)"/>
    <path d="M34 200 C40 208 52 212 62 212 L364 210 C378 208 386 202 389 194 L389 202 C386 212 374 218 360 218 L64 220 C46 220 34 212 34 200 Z" fill="${c.sole}"/>
  </svg>`;
}

function slideArt(id, c) {
  const bumps = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((i) => `<ellipse cx="${66 + i * 38}" cy="${203 - (i % 2) * 3}" rx="22" ry="13" fill="${c.bumps}"/>`)
    .join("");
  return `<svg viewBox="0 0 400 240" aria-hidden="true">
    <defs>
      <pattern id="${id}-knit" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="4.5" cy="4.5" r="1.6" fill="${c.texture}"/>
      </pattern>
    </defs>
    <ellipse cx="206" cy="226" rx="176" ry="9" fill="rgb(0 0 0 / .12)"/>
    ${bumps}
    <path d="M28 180 C24 160 46 150 70 152 L336 148 C366 148 388 160 386 180 C384 202 362 210 336 210 L64 212 C40 212 30 198 28 180 Z" fill="${c.sole}"/>
    <path d="M58 156 L342 151" stroke="${c.footbed}" stroke-width="9" stroke-linecap="round"/>
    <path d="M92 156 C100 102 160 66 234 72 C298 78 340 114 352 153 Z" fill="${c.upper}"/>
    <path d="M92 156 C100 102 160 66 234 72 C298 78 340 114 352 153 Z" fill="url(#${id}-knit)"/>
    <path d="M296 104 C318 116 338 136 348 153 L328 153 C320 136 308 122 292 114 Z" fill="${c.footbed}"/>
    <circle cx="150" cy="130" r="5" fill="${c.spot}"/>
    <circle cx="262" cy="118" r="4" fill="${c.spot}" opacity=".8"/>
  </svg>`;
}

function teeArt(c) {
  return `<svg viewBox="0 0 400 260" aria-hidden="true">
    <path d="M128 44 L166 28 C176 44 224 44 234 28 L272 44 L336 84 L306 128 L274 110 L274 252 L126 252 L126 110 L94 128 L64 84 Z" fill="${c.body}"/>
    <path d="M166 28 C176 46 224 46 234 28 C226 38 174 38 166 28 Z" fill="${c.shade}"/>
    <path d="M126 110 L126 252 L136 252 L136 118 Z M274 110 L274 252 L264 252 L264 118 Z" fill="${c.shade}" opacity=".6"/>
    <g transform="translate(232 104)">
      <circle r="21" fill="none" stroke="${c.print}" stroke-width="4"/>
      <circle r="13" fill="none" stroke="${c.print}" stroke-width="3" stroke-dasharray="4 3"/>
      <circle r="5" fill="${c.print}"/>
    </g>
  </svg>`;
}

// Hand-drawn double underline (used under "cheap" and under unishop prices).
const scribble = (cls, viewBox = "0 0 100 16") => `<svg class="${cls}" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true">
  <path pathLength="1" d="M3 6 C28 2 70 2 97 5"/><path pathLength="1" d="M10 12 C36 9 66 9 90 11"/>
</svg>`;

function productCard(p, index) {
  const image = findPhoto(p.photo);
  const art = image
    ? `<img src="${image}" alt="${p.brand}" loading="lazy" decoding="async">`
    : p.art();
  const save = p.retail - p.ours;
  return `<a class="card ${p.id}" href="/market" style="--i:${index}" data-depth="${(0.4 + index * 0.18).toFixed(2)}"
      aria-label="${p.brand} ${p.retail}$, unishop ${p.ours}$">
    <div class="card-top">
      <div class="card-them">
        <div class="card-brand">${p.brand}</div>
        <div class="card-price">${p.retail}$</div>
      </div>
      <div class="card-ours${p.plain ? " plain" : ""}">
        <div class="card-brand">unishop</div>
        <div class="card-price"><span class="drop" data-from="${p.retail}" data-to="${p.ours}">${p.ours}$</span>${p.plain ? "" : scribble("price-line")}</div>
        <div class="save">Save ${save}$</div>
      </div>
    </div>
    <div class="card-art">${art}</div>
  </a>`;
}

// ---------- Latvia map ----------
// Rough outline of Latvia (lon, lat), projected to an SVG 400×255 box and smoothed.
const LV_BORDER = [
  [21.06, 56.07], [21.0, 56.25], [20.99, 56.5], [21.06, 56.75], [21.15, 56.9], [21.35, 57.1], [21.45, 57.28],
  [21.6, 57.42], [21.75, 57.55], [22.05, 57.62], [22.35, 57.72], [22.6, 57.76], [22.65, 57.62], [22.85, 57.48],
  [23.05, 57.33], [23.15, 57.2], [23.3, 57.05], [23.5, 56.98], [23.75, 56.97], [24.0, 57.02], [24.1, 57.07],
  [24.3, 57.15], [24.4, 57.3], [24.37, 57.5], [24.36, 57.7], [24.32, 57.87], [24.6, 57.95], [25.0, 58.05],
  [25.3, 58.02], [25.7, 57.92], [26.05, 57.83], [26.3, 57.6], [26.6, 57.53], [27.0, 57.58], [27.35, 57.53],
  [27.55, 57.42], [27.85, 57.28], [27.7, 57.05], [27.75, 56.88], [27.95, 56.75], [28.15, 56.55], [28.2, 56.38],
  [28.24, 56.26], [27.95, 56.1], [27.65, 55.93], [27.2, 55.83], [26.85, 55.72], [26.6, 55.67], [26.25, 55.82],
  [26.0, 55.98], [25.75, 56.15], [25.4, 56.18], [25.1, 56.25], [24.85, 56.4], [24.55, 56.28], [24.2, 56.38],
  [23.9, 56.32], [23.6, 56.38], [23.25, 56.33], [22.95, 56.42], [22.6, 56.38], [22.2, 56.42], [21.9, 56.38],
  [21.6, 56.3], [21.3, 56.2],
];
const RIGA = { name: "Rīga", lon: 24.105, lat: 56.949 };
const CITIES = [
  { name: "Liepāja", lon: 21.01, lat: 56.51 },
  { name: "Ventspils", lon: 21.57, lat: 57.39 },
  { name: "Valmiera", lon: 25.43, lat: 57.54 },
  { name: "Rēzekne", lon: 27.33, lat: 56.51 },
  { name: "Daugavpils", lon: 26.53, lat: 55.87 },
  { name: "Jelgava", lon: 23.72, lat: 56.65 },
];

const project = (lon, lat) => [(lon - 20.9) * 54.2, (58.15 - lat) * 100];
const f = (n) => n.toFixed(1);

function smoothClosedPath(points) {
  // Catmull-Rom spline through the points, as cubic Béziers.
  const n = points.length;
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + " Z";
}

function latviaMap() {
  const outline = smoothClosedPath(LV_BORDER.map(([lon, lat]) => project(lon, lat)));
  const [rx, ry] = project(RIGA.lon, RIGA.lat);
  const routes = CITIES.map((city, i) => {
    const [cx, cy] = project(city.lon, city.lat);
    // Curve bends to one side of the straight line, like a flight path.
    const mx = (rx + cx) / 2, my = (ry + cy) / 2, dx = cx - rx, dy = cy - ry;
    const len = Math.hypot(dx, dy) || 1, bend = Math.min(40, len * 0.28);
    const qx = mx - (dy / len) * bend, qy = my + (dx / len) * bend;
    const d = `M${f(rx)} ${f(ry)} Q${f(qx)} ${f(qy)} ${f(cx)} ${f(cy)}`;
    const delay = (2.2 + i * 0.25).toFixed(2);
    return `<g class="lv-city" style="--d:${delay}s" tabindex="0" aria-label="${city.name}: delivery in 1–3 days">
      <path id="lv-route-${i}" class="lv-route" pathLength="1" d="${d}"/>
      <circle class="lv-runner" r="2.6">
        <animateMotion dur="${(2.6 + i * 0.35).toFixed(2)}s" begin="${(Number(delay) + 0.8).toFixed(2)}s" repeatCount="indefinite" rotate="auto">
          <mpath href="#lv-route-${i}"/>
        </animateMotion>
      </circle>
      <circle class="lv-dot" cx="${f(cx)}" cy="${f(cy)}" r="3.4"/>
      <circle class="lv-hit" cx="${f(cx)}" cy="${f(cy)}" r="14"/>
      <text class="lv-label" x="${f(cx)}" y="${f(cy - 10)}" text-anchor="middle">${city.name} · 1–3 days</text>
    </g>`;
  }).join("");
  return `<svg class="lv-map" viewBox="-6 -6 412 267" role="img" aria-label="Map of Latvia: we deliver from Rīga to the whole country">
    <path class="lv-fill" d="${outline}"/>
    <path class="lv-outline" pathLength="1" d="${outline}"/>
    ${routes}
    <g class="lv-riga">
      <circle class="lv-pulse" cx="${f(rx)}" cy="${f(ry)}" r="5"/>
      <circle class="lv-pulse p2" cx="${f(rx)}" cy="${f(ry)}" r="5"/>
      <circle class="lv-hub" cx="${f(rx)}" cy="${f(ry)}" r="5"/>
      <text class="lv-riga-label" x="${f(rx + 9)}" y="${f(ry + 4)}">Rīga</text>
    </g>
  </svg>`;
}

// ---------- Styles ----------
export const homeStyles = `
  .home {
    --u: calc(100vw / 1920);
    --orange: #ff7f27; --blue: #2747a8; --ink: #111111;
    position: relative; height: max(100vh, calc(1080 * var(--u))); overflow: hidden;
    background: #fff; color: var(--ink);
  }

  /* Headline + buttons */
  .home-head { position: absolute; left: calc(128 * var(--u)); top: calc(108 * var(--u)); z-index: 2; }
  .home-head h1 {
    margin: 0; font-weight: 400; font-size: calc(66 * var(--u)); line-height: 1.24; letter-spacing: .015em;
  }
  .home-head h1 .line { display: block; overflow: hidden; padding-bottom: .06em; }
  .home-head h1 .line > span { display: inline-block; animation: rise .9s cubic-bezier(.2,.8,.2,1) both; }
  .home-head h1 .line:nth-child(2) > span { animation-delay: .12s; }
  .cheap { position: relative; color: var(--orange); display: inline-block; }
  .cheap-line {
    position: absolute; left: -3%; right: -12%; bottom: -.12em; width: 115%; height: .3em;
    fill: none; stroke: var(--orange); stroke-width: 3; stroke-linecap: round; overflow: visible;
  }
  .cheap-line path, .price-line path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .7s ease-out forwards; }
  .cheap-line path { animation-delay: .9s; }
  .cheap-line path + path { animation-delay: 1.1s; }

  .home-cta { display: flex; gap: calc(12 * var(--u)); margin-top: calc(34 * var(--u)); }
  .cta {
    display: inline-flex; align-items: center; height: calc(58 * var(--u)); padding: 0 calc(16 * var(--u));
    border-radius: 999px; font-size: calc(38 * var(--u)); line-height: 1; color: #fff;
    animation: rise .8s cubic-bezier(.2,.8,.2,1) both; animation-delay: .3s;
    transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
  }
  .cta + .cta { animation-delay: .38s; }
  .cta-orange { background: var(--orange); }
  .cta-black { background: #000; }
  .cta:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 10px 24px rgb(0 0 0 / .14); }
  .cta-orange:hover { box-shadow: 0 10px 24px rgb(255 127 39 / .35); }
  .cta:active { transform: scale(.96); }

  /* Latvia map */
  .home-map {
    position: absolute; left: calc(92 * var(--u)); top: calc(404 * var(--u)); width: calc(615 * var(--u));
    z-index: 1; transition: transform .4s ease-out;
  }
  .lv-map { display: block; width: 100%; height: auto; overflow: visible; }
  .lv-outline {
    fill: none; stroke: var(--ink); stroke-width: 1.1; stroke-linejoin: round;
    stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 2.4s ease-in-out .2s forwards;
  }
  .lv-fill { fill: var(--orange); opacity: 0; animation: fill-in 1.2s ease-out 2s forwards; }
  .lv-route {
    fill: none; stroke: var(--orange); stroke-width: 1.3; stroke-linecap: round;
    stroke-dasharray: 1; stroke-dashoffset: 1; opacity: .55;
    animation: draw 1s ease-out var(--d) forwards; transition: opacity .2s, stroke-width .2s;
  }
  .lv-runner { fill: var(--orange); opacity: 0; animation: appear .3s ease-out calc(var(--d) + .8s) forwards; }
  .lv-dot { fill: var(--ink); opacity: 0; animation: appear .4s ease-out var(--d) forwards; transition: r .2s; }
  .lv-hit { fill: transparent; cursor: pointer; }
  .lv-label {
    font-size: 11px; fill: var(--ink); opacity: 0; transform: translateY(4px);
    transition: opacity .2s, transform .2s; pointer-events: none; paint-order: stroke;
    stroke: #fff; stroke-width: 4px; stroke-linejoin: round;
  }
  .lv-city { outline: none; }
  .lv-city:hover .lv-route, .lv-city:focus .lv-route { opacity: 1; stroke-width: 2.2; }
  .lv-city:hover .lv-dot, .lv-city:focus .lv-dot { r: 5; fill: var(--orange); }
  .lv-city:hover .lv-label, .lv-city:focus .lv-label { opacity: 1; transform: none; }
  .lv-hub { fill: var(--orange); }
  .lv-pulse {
    fill: var(--orange); transform-box: fill-box; transform-origin: center;
    animation: pulse 2.4s ease-out infinite; opacity: 0;
  }
  .lv-pulse.p2 { animation-delay: 1.2s; }
  .lv-riga-label { font-size: 12px; font-weight: 500; fill: var(--ink); }

  .home-only { position: absolute; left: calc(93 * var(--u)); top: calc(772 * var(--u)); width: calc(330 * var(--u)); z-index: 1; }
  .home-only h2 { margin: 0 0 calc(6 * var(--u)); font-weight: 400; font-size: calc(44 * var(--u)); letter-spacing: .01em; }
  .home-only p { margin: 0; font-size: calc(29 * var(--u)); line-height: 1.38; }
  .home-only > * { animation: rise .8s cubic-bezier(.2,.8,.2,1) both; animation-delay: .5s; }
  .home-only p { animation-delay: .6s; }

  /* Product cards */
  .card {
    --px: 0px; --py: 0px; --rx: 0deg; --ry: 0deg; --lift: 0px; --s: 1;
    position: absolute; display: block; overflow: hidden; background: #fff; border-radius: calc(44 * var(--u));
    box-shadow: 0 calc(-4 * var(--u)) calc(34 * var(--u)) rgb(0 0 0 / .06), 0 calc(24 * var(--u)) calc(60 * var(--u)) rgb(0 0 0 / .07);
    transform: perspective(1200px) translate3d(var(--px), calc(var(--py) + var(--lift)), 0) rotateX(var(--rx)) rotateY(var(--ry));
    transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s;
    animation: card-in 1s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(.25s + var(--i) * .1s);
    will-change: transform;
  }
  .card:hover, .card:focus-visible {
    --lift: calc(-14 * var(--u)); z-index: 20;
    box-shadow: 0 calc(30 * var(--u)) calc(80 * var(--u)) rgb(0 0 0 / .16);
  }
  .card:focus-visible { outline: 3px solid var(--orange); outline-offset: 4px; }
  .c1 { left: calc(1255 * var(--u)); top: calc(28 * var(--u)); width: calc(650 * var(--u)); height: calc(640 * var(--u)); z-index: 1; }
  .c2 { left: calc(745 * var(--u)); top: calc(185 * var(--u)); width: calc(540 * var(--u)); height: calc(520 * var(--u)); z-index: 2; --s: .84; }
  .c3 { left: calc(1045 * var(--u)); top: calc(525 * var(--u)); width: calc(555 * var(--u)); height: calc(600 * var(--u)); z-index: 3; --s: .84; }
  .c4 { left: calc(430 * var(--u)); top: calc(600 * var(--u)); width: calc(655 * var(--u)); height: calc(560 * var(--u)); z-index: 4; }
  .c5 { left: calc(1555 * var(--u)); top: calc(635 * var(--u)); width: calc(470 * var(--u)); height: calc(520 * var(--u)); z-index: 5; --s: .9; }

  .card-top {
    position: relative; z-index: 2; display: flex; justify-content: space-between; gap: 12px;
    padding: calc(42 * var(--u) * var(--s)) calc(36 * var(--u) * var(--s)) 0;
  }
  .card-brand { font-size: calc(38 * var(--u) * var(--s)); line-height: 1.15; letter-spacing: .01em; white-space: nowrap; }
  .card-price { position: relative; font-size: calc(48 * var(--u) * var(--s)); line-height: 1.12; font-weight: 500; }
  .card-ours { text-align: right; }
  .card-ours .card-price { color: var(--blue); display: inline-block; }
  .card-ours.plain .card-price { color: var(--ink); }
  .price-line {
    position: absolute; left: -2%; bottom: -.16em; width: 104%; height: .3em; overflow: visible;
    fill: none; stroke: var(--blue); stroke-width: 2.4; stroke-linecap: round;
  }
  .price-line path { animation-delay: calc(1.4s + var(--i) * .1s); }
  .price-line path + path { animation-delay: calc(1.55s + var(--i) * .1s); }
  .save {
    display: inline-block; margin-top: calc(14 * var(--u) * var(--s)); padding: .25em .7em; border-radius: 999px;
    background: var(--orange); color: #fff; font-size: calc(22 * var(--u) * var(--s)); font-weight: 500;
    opacity: 0; transform: translateY(-6px) scale(.9); transition: opacity .25s, transform .3s cubic-bezier(.34,1.56,.64,1);
  }
  .card:hover .save, .card:focus-visible .save { opacity: 1; transform: none; }
  .card-art {
    position: absolute; left: 0; right: 0; bottom: 0; top: 36%;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .card-art svg, .card-art img {
    width: 92%; height: auto; max-height: 100%; object-fit: contain;
    transition: transform .5s cubic-bezier(.2,.8,.2,1);
  }
  .c1 .card-art { top: 30%; align-items: center; } .c1 .card-art svg { width: 100%; transform: translate(4%, 0); }
  .c2 .card-art svg { width: 72%; transform: translateY(14%); }
  .c3 .card-art { align-items: center; } .c3 .card-art svg { width: 108%; transform: translate(10%, -6%); }
  .c4 .card-art svg { width: 108%; transform: translate(-2%, 10%); }
  .c5 .card-art { align-items: center; } .c5 .card-art svg { width: 112%; transform: translate(6%, 4%); }
  .card:hover .card-art svg, .card:hover .card-art img { transform: scale(1.06) rotate(-2deg); }
  /* Photos: white backgrounds blend into the white card. */
  .card-art img { width: 100%; height: 100%; max-height: none; object-fit: contain; object-position: center bottom; mix-blend-mode: multiply; }
  .c1 .card-art img, .c3 .card-art img, .c5 .card-art img { object-position: center; }

  @keyframes rise { from { opacity: 0; transform: translateY(40%); } }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes appear { to { opacity: 1; } }
  @keyframes fill-in { to { opacity: .07; } }
  @keyframes pulse { 0% { opacity: .55; transform: scale(1); } 100% { opacity: 0; transform: scale(4.2); } }
  @keyframes card-in { from { opacity: 0; translate: 0 calc(120 * var(--u)); } }

  /* Phones and small tablets: stacked layout, swipeable cards */
  @media (max-width: 900px) {
    .home { --u: 1px; height: auto; padding: 96px 0 48px; }
    .home-head, .home-map, .home-only, .card { position: relative; left: auto; top: auto; }
    .home-head { padding: 0 20px; }
    .home-head h1 { font-size: clamp(2.3rem, 10vw, 3.4rem); }
    .home-cta { margin-top: 22px; gap: 10px; flex-wrap: wrap; }
    .cta { height: 48px; padding: 0 18px; font-size: 1.25rem; }
    .home-cards {
      display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 32px 20px 40px;
      scrollbar-width: none;
    }
    .home-cards::-webkit-scrollbar { display: none; }
    .card {
      flex: none; width: min(78vw, 340px); height: min(96vw, 420px); scroll-snap-align: center;
      border-radius: 32px; --s: 1 !important;
    }
    .card-top { padding: 26px 24px 0; }
    .card-brand { font-size: 1.15rem; }
    .card-price { font-size: 1.6rem; }
    .save { font-size: .85rem; margin-top: 8px; }
    .home-map { width: calc(100% - 40px); max-width: 520px; margin: 0 auto; }
    .home-only { width: auto; padding: 24px 20px 0; max-width: 520px; margin: 0 auto; }
    .home-only h2 { font-size: 1.7rem; margin-bottom: 6px; }
    .home-only p { font-size: 1.1rem; }
  }
  @media (min-width: 901px) { .home-cards { display: contents; } }

  @media (prefers-reduced-motion: reduce) {
    .home *, .home *::before, .home *::after { animation-duration: .01ms !important; animation-delay: 0s !important; }
    .lv-pulse, .lv-runner { display: none; }
  }
`;

// ---------- Markup ----------
export function homeBody() {
  return `<section class="home" aria-label="UNICLOTHES home">
    <div class="home-head">
      <h1>
        <span class="line"><span>Off you buy</span></span>
        <span class="line"><span>where it’s <span class="cheap">cheap${scribble("cheap-line", "0 0 100 16")}</span></span></span>
      </h1>
      <div class="home-cta">
        <a class="cta cta-orange" href="/market">Browse market</a>
        <a class="cta cta-black" href="/register">Register</a>
      </div>
    </div>

    <div class="home-map" data-depth="-0.25">${latviaMap()}</div>

    <div class="home-only">
      <h2>ONLY LATVIA</h2>
      <p>We deliver only in latvia, we do not deliver our products to other countries</p>
    </div>

    <div class="home-cards">
      ${products.map(productCard).join("")}
    </div>
  </section>`;
}

// ---------- Interactivity ----------
// Mouse parallax on the cards and map, 3D tilt on the hovered card, and the unishop price
// "dropping" from the official price when a card comes into view.
export const homeScript = `<script>
  (function () {
    var home = document.querySelector(".home");
    if (!home) return;
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var desktop = matchMedia("(min-width: 901px) and (hover: hover)");
    var cards = Array.prototype.slice.call(home.querySelectorAll(".card"));
    var map = home.querySelector(".home-map");

    // Price drop: count down from the official price to ours.
    function runDrop(el) {
      var from = Number(el.dataset.from), to = Number(el.dataset.to);
      if (reduce || !(from > to)) { el.textContent = to + "$"; return; }
      var start = null, dur = 1100;
      function step(t) {
        if (start === null) start = t;
        var k = Math.min(1, (t - start) / dur), eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * eased) + "$";
        if (k < 1) requestAnimationFrame(step);
      }
      el.textContent = from + "$";
      requestAnimationFrame(step);
    }
    var drops = home.querySelectorAll(".drop");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          var card = e.target.closest(".card");
          var delay = card ? 700 + Number(getComputedStyle(card).getPropertyValue("--i")) * 100 : 0;
          setTimeout(function () { runDrop(e.target); }, delay);
        });
      }, { threshold: 0.4 });
      drops.forEach(function (d) { d.textContent = d.dataset.from + "$"; io.observe(d); });
    }

    if (reduce) return;

    // Parallax: everything with data-depth drifts with the mouse.
    var targetX = 0, targetY = 0, frame = 0;
    function applyParallax() {
      frame = 0;
      cards.forEach(function (c) {
        var depth = Number(c.dataset.depth || 0.5);
        c.style.setProperty("--px", (targetX * depth * 18).toFixed(1) + "px");
        c.style.setProperty("--py", (targetY * depth * 12).toFixed(1) + "px");
      });
      if (map) {
        var md = Number(map.dataset.depth || 0);
        map.style.transform = "translate(" + (targetX * md * 18).toFixed(1) + "px," + (targetY * md * 12).toFixed(1) + "px)";
      }
    }
    home.addEventListener("pointermove", function (e) {
      if (!desktop.matches) return;
      var r = home.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(applyParallax);
    });
    home.addEventListener("pointerleave", function () {
      targetX = 0; targetY = 0;
      if (!frame) frame = requestAnimationFrame(applyParallax);
    });

    // Tilt the hovered card toward the cursor.
    cards.forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        if (!desktop.matches) return;
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
        c.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
      });
      c.addEventListener("pointerleave", function () {
        c.style.setProperty("--rx", "0deg");
        c.style.setProperty("--ry", "0deg");
      });
    });
  })();
</script>`;
