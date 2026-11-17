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

test("home shows 4 price-comparison cards, ONLY LATVIA under the buttons, no map or Chrome Hearts", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.equal((html.match(/<a class="card c\d"/g) || []).length, 4);
  for (const [brand, retail, ours] of [["Nike Official", 130, 30], ["ASICS Official", 300, 40], ["Nike Official", 130, 80], ["Asics Official", 150, 45]]) {
    assert.ok(html.includes(`aria-label="${brand} ${retail}$, unishop ${ours}$"`), `card for ${brand} ${retail}`);
  }
  assert.equal((html.match(/<div class="card-note">Not official reselling<\/div>/g) || []).length, 11, "on every card (4 hero + 7 grid)");
  assert.match(html, /unishop is not affiliated with Nike or ASICS/);
  assert.doesNotMatch(html, /Chrome Hearts|lv-map|animateMotion/);
  const head = html.split('<div class="home-head">')[1].split('<div class="home-cards">')[0];
  assert.ok(head.indexOf(">Register<") < head.indexOf("ONLY LATVIA"), "ONLY LATVIA comes right after the buttons");
});

test("More Nike grid has 7 cards with photos and names", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /<section class="more"/);
  assert.equal((html.match(/<a class="card g\d grid-card"/g) || []).length, 7);
  for (const name of ["Nike Air Max Dn8", "Nike Shox TL", "Nike Air Force 1 '07", "Nike Air Max Plus"]) {
    assert.ok(html.includes(`<div class="card-name">${name}</div>`), name);
  }
});

test("unishop price sits in a right-aligned column, not beside the Save badge", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /\.card-ours \{ display: flex; flex-direction: column; align-items: flex-end;/);
});

test("product photos are used; photo URLs 404 cleanly", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.equal((html.match(/<div class="card-art"><img src="\/products\//g) || []).length, 11);
  assert.equal((await fetch(`${base}/products/does-not-exist.png`)).status, 404);
});

test("every nav link resolves", async () => {
  for (const path of ["/market", "/about", "/contact", "/register", "/cart"]) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 200, `${path} should return 200`);
  }
});
