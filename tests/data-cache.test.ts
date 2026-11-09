import test from "node:test";
import assert from "node:assert/strict";
import {
  CACHE_STORE_KEY,
  clearCache,
  readCache,
  writeCache,
} from "../src/lib/data-cache.ts";

test("a written value is readable until it expires", () => {
  clearCache();
  writeCache("k", "v", 60_000);
  assert.equal(readCache("k"), "v");
});

test("an expired value is not returned", () => {
  clearCache();
  writeCache("k", "v", -1);
  assert.equal(readCache("k"), undefined);
});

test("clearCache drops every entry", () => {
  clearCache();
  writeCache("a", 1, 60_000);
  writeCache("b", 2, 60_000);
  clearCache();
  assert.equal(readCache("a"), undefined);
  assert.equal(readCache("b"), undefined);
});

test("the store lives on globalThis so every bundle shares one instance", () => {
  // Route handlers and pages are separate module graphs in Next.js. A plain
  // module-level Map would give each bundle its own cache, so an admin write
  // would clear a copy nobody reads. The store must be process-wide.
  clearCache();
  writeCache("shared", "value", 60_000);

  const store = (globalThis as Record<string, unknown>)[CACHE_STORE_KEY];
  assert.ok(store instanceof Map);
  assert.equal((store as Map<string, { value: unknown }>).get("shared")?.value, "value");

  clearCache();
});
