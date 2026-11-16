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

test("home page says Hello Latvia and has the navbar", async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /Hello Latvia 🇱🇻/);
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

test("home has the ShapeWaves hero with UNICLOTHES carved out", async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /<div class="shape-waves" id="shape-waves"/);
  assert.match(html, /<h1 class="hero-title">UNICLOTHES<\/h1>/);
  assert.match(html, /function shapeWavesClient/);
  assert.match(html, /"text":"UNICLOTHES"/);
  assert.ok(!/<\/script/i.test(html.split("function shapeWavesClient")[1].split("</script>")[0]), "inline script must not close early");
});

test("ShapeWaves client source parses as JavaScript", async () => {
  const { shapeWavesClient } = await import("../src/shape-waves.js");
  assert.doesNotThrow(() => new Function(`return (${shapeWavesClient.toString()});`));
});

test("every nav link resolves", async () => {
  for (const path of ["/market", "/about", "/contact", "/register", "/cart"]) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 200, `${path} should return 200`);
  }
});
