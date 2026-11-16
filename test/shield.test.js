// Shield tests. Runs in its own process (node --test isolates files), so these env vars don't
// affect the other tests. Low difficulty keeps the proof-of-work fast.
process.env.NODE_ENV = "test";
process.env.SHIELD_SECRET = "test-shield-secret";
process.env.SHIELD_DIFFICULTY = "8";

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { sha256Source, zeroBitsSource } from "../src/sha256.js";

const sha256Hex = new Function(`${sha256Source}; return sha256Hex;`)();
const zeroBits = new Function(`${zeroBitsSource}; return zeroBits;`)();

const { default: app } = await import("../server.js");
let server, base;

before(() => {
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

async function getTask() {
  const res = await fetch(`${base}/market`);
  assert.equal(res.status, 403);
  const html = await res.text();
  return { html, task: JSON.parse(html.match(/var task = (\{.*?\});/)[1]) };
}

function solve(task) {
  for (let nonce = 0; ; nonce++) {
    if (zeroBits(sha256Hex(`${task.challenge}:${nonce}`)) >= task.difficulty) return nonce;
  }
}

const verify = (body) =>
  fetch(`${base}/shield/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("browser sha256 matches Node's", () => {
  for (const input of ["", "abc", "a".repeat(55), "b".repeat(56), "c".repeat(64), "1789.ab12cd:123456", "x".repeat(200)]) {
    assert.equal(sha256Hex(input), crypto.createHash("sha256").update(input).digest("hex"), `input length ${input.length}`);
  }
});

test("visitors without a pass get our check page (no Cloudflare)", async () => {
  const { html, task } = await getTask();
  assert.match(html, /Checking you're human/);
  assert.match(html, /uniclothessupport@proton\.me/);
  assert.doesNotMatch(html, /cloudflare/i);
  assert.ok(!html.includes("test-shield-secret"), "secret must never reach the page");
  assert.equal(task.difficulty, 8);
});

test("health check and favicons skip the check", async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal((await fetch(`${base}/favicon-dark.svg`)).status, 200);
});

test("a solved challenge gives a pass cookie that unlocks the site", async () => {
  const { task } = await getTask();
  const res = await verify({ ...task, nonce: solve(task) });
  assert.equal(res.status, 200);
  const setCookie = res.headers.get("set-cookie");
  assert.match(setCookie, /^uc_pass=\d+\.[\w-]+; Path=\/; Max-Age=86400; HttpOnly; SameSite=Lax/);

  const page = await fetch(`${base}/`, { headers: { cookie: setCookie.split(";")[0] } });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Hello Latvia/);
});

test("wrong answers, forged challenges and forged cookies are rejected", async () => {
  const { task } = await getTask();
  let bad = 0;
  while (zeroBits(sha256Hex(`${task.challenge}:${bad}`)) >= task.difficulty) bad++;
  assert.equal((await verify({ ...task, nonce: bad })).status, 403);

  const forged = { ...task, challenge: `${Math.floor(Date.now() / 1000) + 60}.deadbeef` };
  assert.equal((await verify({ ...forged, nonce: solve(forged) })).status, 403);

  assert.equal((await verify({ challenge: 1 })).status, 400);

  const cookie = `uc_pass=${Math.floor(Date.now() / 1000) + 999}.not-a-real-signature`;
  assert.equal((await fetch(`${base}/`, { headers: { cookie } })).status, 403);
});

test("verify endpoint is rate limited per IP", async () => {
  let last;
  for (let i = 0; i < 25; i++) last = await verify({ challenge: 1 });
  assert.equal(last.status, 429);
  assert.ok(Number(last.headers.get("retry-after")) > 0);
});
