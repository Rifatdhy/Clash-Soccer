import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const testUrl = process.env.TEST_DATABASE_URL;
const skip = testUrl ? false : "TEST_DATABASE_URL not set";

if (testUrl) {
  process.env.DATABASE_URL = testUrl;
}

test("postgres store allows up to the maximum then blocks", { skip }, async () => {
  const { query } = await import("../../src/lib/db.ts");
  const { createPostgresStore } = await import("../../src/lib/rate-limit-store.ts");

  const store = createPostgresStore((text, params) => query(text, params));
  const key = `test-rate-${randomUUID()}`;

  try {
    assert.equal((await store.consume(key, { windowMs: 60_000, max: 2 })).allowed, true);
    assert.equal((await store.consume(key, { windowMs: 60_000, max: 2 })).allowed, true);

    const blocked = await store.consume(key, { windowMs: 60_000, max: 2 });
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterMs > 0);

    await store.reset(key);
    assert.equal((await store.consume(key, { windowMs: 60_000, max: 2 })).allowed, true);
  } finally {
    await store.reset(key);
  }
});
