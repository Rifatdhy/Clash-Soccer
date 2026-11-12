import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const testUrl = process.env.TEST_DATABASE_URL;
const skip = testUrl ? false : "TEST_DATABASE_URL not set";

if (testUrl) {
  process.env.DATABASE_URL = testUrl;
}

const uniqueId = (prefix: string) => `${prefix}-${randomUUID()}`;

test("database rejects slots_available above slots_total", { skip }, async () => {
  const { query } = await import("../../src/lib/db.ts");
  const id = uniqueId("test-match");

  await assert.rejects(() =>
    query(
      `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, "Invalid slots", "2026-01-01", "10:00", "Lapangan", 10, 11]
    )
  );
});

test("database rejects negative slots_available", { skip }, async () => {
  const { query } = await import("../../src/lib/db.ts");
  const id = uniqueId("test-match");

  await assert.rejects(() =>
    query(
      `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, "Negative slots", "2026-01-01", "10:00", "Lapangan", 10, -1]
    )
  );
});

test("database rejects an update that pushes availability past the total", { skip }, async () => {
  const { query } = await import("../../src/lib/db.ts");
  const id = uniqueId("test-match");

  await query(
    `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, "Valid slots", "2026-01-01", "10:00", "Lapangan", 10, 5]
  );

  try {
    await assert.rejects(() =>
      query("UPDATE matches SET slots_available = $1 WHERE id = $2", [11, id])
    );
  } finally {
    await query("DELETE FROM matches WHERE id = $1", [id]);
  }
});
