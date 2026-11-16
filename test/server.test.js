process.env.NODE_ENV = "test";

import { test } from "node:test";
import assert from "node:assert/strict";

const { default: app } = await import("../server.js");

test("home page says Hello Latvia", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Hello Latvia 🇱🇻/);
  } finally {
    server.close();
  }
});
