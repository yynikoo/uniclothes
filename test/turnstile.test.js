// Turnstile check tests. Runs in its own process (node --test isolates files), so the env vars
// set here don't affect the other tests. Cloudflare's siteverify call is stubbed.
process.env.NODE_ENV = "test";
process.env.TURNSTILE_SITE_KEY = "test-site-key";
process.env.TURNSTILE_SECRET_KEY = "test-secret-key";

import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const realFetch = globalThis.fetch;
let cloudflareSays = true;
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith("https://challenges.cloudflare.com/")) {
    const form = new URLSearchParams(options.body);
    assert.equal(form.get("secret"), "test-secret-key");
    return new Response(JSON.stringify({ success: cloudflareSays && form.get("response") === "good-token" }));
  }
  return realFetch(url, options);
};

const { default: app } = await import("../server.js");
let server, base;

before(() => {
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const verify = (token) =>
  fetch(`${base}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

test("visitors without a pass get the check page", async () => {
  const res = await fetch(`${base}/market`);
  assert.equal(res.status, 403);
  const html = await res.text();
  assert.match(html, /Checking you're human/);
  assert.match(html, /challenges\.cloudflare\.com\/turnstile/);
  assert.match(html, /"test-site-key"/);
  assert.match(html, /uniclothessupport@proton.me/);
  assert.ok(!html.includes("test-secret-key"), "secret must never reach the page");
});

test("health check and favicons skip the check", async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal((await fetch(`${base}/favicon-dark.svg`)).status, 200);
});

test("a bad token is rejected and sets no cookie", async () => {
  const res = await verify("bad-token");
  assert.equal(res.status, 403);
  assert.equal(res.headers.get("set-cookie"), null);
  assert.equal((await verify("")).status, 400);
});

test("a good token gives a pass cookie that unlocks the site", async () => {
  const res = await verify("good-token");
  assert.equal(res.status, 200);
  const setCookie = res.headers.get("set-cookie");
  assert.match(setCookie, /^uc_verified=\d+\.[\w-]+; Path=\/; Max-Age=86400; HttpOnly; SameSite=Lax/);

  const cookie = setCookie.split(";")[0];
  const page = await fetch(`${base}/`, { headers: { cookie } });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Hello Latvia/);
});

test("a tampered or expired cookie doesn't pass", async () => {
  const forged = `uc_verified=${Math.floor(Date.now() / 1000) + 999}.not-a-real-signature`;
  assert.equal((await fetch(`${base}/`, { headers: { cookie: forged } })).status, 403);
  assert.equal((await fetch(`${base}/`, { headers: { cookie: "uc_verified=1.abc" } })).status, 403);
});
