import test from "node:test";
import assert from "node:assert/strict";
import {
  CACHE_PRUNE_THRESHOLD,
  CACHE_STORE_KEY,
  pruneCache,
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

test("an entry written with a short ttl is dropped once the store is pruned", () => {
  clearCache();
  writeCache("short", "v", -1);
  writeCache("long", "v2", 60_000);

  pruneCache();

  assert.equal(readCache("short"), undefined);
  assert.equal(readCache("long"), "v2");
});

test("pruneCache keeps the store from growing without bound", () => {
  // /gallery/<id> and /news/<slug> are public, so a crawler can mint keys
  // faster than they are read again. Entries that were never re-read would
  // otherwise live forever.
  clearCache();
  for (let i = 0; i < 5000; i += 1) {
    writeCache(`album:${i}`, { id: i }, -1);
  }

  pruneCache();

  const store = (globalThis as Record<string, unknown>)[CACHE_STORE_KEY] as Map<string, unknown>;
  assert.equal(store.size, 0);
});

test("pruneCache runs automatically on write once the store is large", () => {
  clearCache();
  for (let i = 0; i < CACHE_PRUNE_THRESHOLD + 1; i += 1) {
    writeCache(`k${i}`, i, -1);
  }

  const store = (globalThis as Record<string, unknown>)[CACHE_STORE_KEY] as Map<string, unknown>;
  assert.ok(
    store.size <= CACHE_PRUNE_THRESHOLD,
    `store should be pruned on write, still holds ${store.size}`
  );
});
