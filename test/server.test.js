process.env.NODE_ENV = "test";

import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const { default: app } = await import("../server.js");
let server, base;

before(() => {
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test("home page has the mockup content and the navbar", async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /Off you buy/);
  assert.match(html, /<span class="cheap">cheap/);
  assert.match(html, />Browse market</);
  assert.match(html, /ONLY LATVIA/);
  assert.match(html, /We deliver only in latvia/);
  for (const label of ["Home", "Market", "About", "Contact Us", "Register", "Cart"]) {
    assert.ok(html.includes(`>${label}<`), `navbar is missing ${label}`);
  }
});

test("navbar has the UNICLOTHES wordmark, theme toggle and favicon", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /<span class="brand">UNICLOTHES<\/span>/);
  assert.match(html, /class="theme-toggle"/);
  assert.match(html, /id="favicon"/);
});

test("light and dark favicons are served", async () => {
  for (const [theme, color] of [["light", "#000000"], ["dark", "#ffffff"]]) {
    const res = await fetch(`${base}/favicon-${theme}.svg`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /image\/svg\+xml/);
    const svg = await res.text();
    assert.ok(svg.includes(`fill="${color}"`), `${theme} favicon should be ${color}`);
    assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  }
});

test("home is locked to the white theme", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /<html lang="en" data-force-theme="light" data-theme="light">/);
  const other = await (await fetch(`${base}/market`)).text();
  assert.match(other, /<html lang="en">/, "other pages keep the theme toggle");
});

test("home shows 5 price-comparison cards and the animated Latvia map", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.equal((html.match(/<a class="card c\d"/g) || []).length, 5);
  for (const [brand, retail, ours] of [["Nike Official", 130, 30], ["Chrome Hearts off", 119, 34], ["ASICS Official", 300, 40]]) {
    assert.ok(html.includes(`aria-label="${brand} ${retail}$, unishop ${ours}$"`), `card for ${brand}`);
  }
  assert.match(html, /class="lv-map"/);
  assert.match(html, /class="lv-outline" pathLength="1" d="M[\d.]+ [\d.]+ C/);
  assert.equal((html.match(/class="lv-city"/g) || []).length, 6);
  assert.match(html, /<animateMotion/);
});

test("missing product photos fall back to drawings; photo URLs 404 cleanly", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.ok((html.match(/<div class="card-art">(<svg|<img)/g) || []).length === 5);
  assert.equal((await fetch(`${base}/products/does-not-exist.png`)).status, 404);
});

test("every nav link resolves", async () => {
  for (const path of ["/market", "/about", "/contact", "/register", "/cart"]) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 200, `${path} should return 200`);
  }
});
