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
    assert.ok(html.includes(`>${label}</a>`), `navbar is missing ${label}`);
  }
});

test("every nav link resolves", async () => {
  for (const path of ["/market", "/about", "/contact", "/register", "/cart"]) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 200, `${path} should return 200`);
  }
});
