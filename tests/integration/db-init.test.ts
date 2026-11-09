import test from "node:test";
import assert from "node:assert/strict";

const testUrl = process.env.TEST_DATABASE_URL;
const skip = testUrl ? false : "TEST_DATABASE_URL not set";

if (testUrl) {
  process.env.DATABASE_URL = testUrl;
}

test("initDatabase is idempotent and applies nothing twice", { skip }, async () => {
  const { initDatabase } = await import("../../src/lib/db-init.ts");

  const first = await initDatabase();
  const second = await initDatabase();

  assert.deepEqual(first.applied, []);
  assert.deepEqual(second.applied, []);
});

test(
  "concurrent initDatabase calls serialize on the advisory lock",
  { skip },
  async () => {
    // Two deploys hitting /api/db-init at once used to both read an empty
    // `schema_migrations` and both try to apply 0001. With the lock they take
    // turns, so neither fails and neither applies anything twice.
    const { initDatabase } = await import("../../src/lib/db-init.ts");

    const results = await Promise.all([
      initDatabase(),
      initDatabase(),
      initDatabase(),
    ]);

    for (const result of results) {
      assert.deepEqual(result.applied, []);
    }
  }
);
