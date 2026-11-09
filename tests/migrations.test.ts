import test from "node:test";
import assert from "node:assert/strict";
import { invalidMigrationFiles, MIGRATION_LOCK_ID, parseMigrationFileName, selectPendingMigrations, withMigrationLock } from "../src/lib/migrations.ts";

test("parseMigrationFileName accepts numbered sql files", () => {
  assert.deepEqual(parseMigrationFileName("0001_init.sql"), {
    version: "0001",
    name: "init",
  });
});

test("parseMigrationFileName rejects files without a numeric prefix", () => {
  assert.equal(parseMigrationFileName("init.sql"), null);
  assert.equal(parseMigrationFileName("0001_init.txt"), null);
});

test("parseMigrationFileName accepts versions longer than four digits", () => {
  assert.deepEqual(parseMigrationFileName("00010_add_x.sql"), {
    version: "00010",
    name: "add_x",
  });
});

test("invalidMigrationFiles reports sql files the runner would skip", () => {
  assert.deepEqual(
    invalidMigrationFiles(["0001_a.sql", "bad name.sql", "2026-11-09_x.sql", "notes.txt"]),
    ["2026-11-09_x.sql", "bad name.sql"]
  );
});

test("selectPendingMigrations returns unapplied files in order", () => {
  const pending = selectPendingMigrations(
    ["0003_third.sql", "0001_first.sql", "0002_second.sql"],
    ["0001"]
  );
  assert.deepEqual(
    pending.map((m) => m.version),
    ["0002", "0003"]
  );
});

test("selectPendingMigrations ignores already applied and invalid files", () => {
  const pending = selectPendingMigrations(["0001_a.sql", "notes.txt"], ["0001"]);
  assert.deepEqual(pending, []);
});

test("MIGRATION_LOCK_ID is the one constant both runners share", () => {
  assert.equal(MIGRATION_LOCK_ID, 4829163);
});

test("withMigrationLock takes the lock before the work and releases it after", async () => {
  const calls: string[] = [];
  const client = {
    query: async (text: string) => {
      calls.push(text);
      return { rows: [] };
    },
  };

  const result = await withMigrationLock(client, async () => {
    calls.push("work");
    return "done";
  });

  assert.equal(result, "done");
  assert.equal(calls.length, 3);
  assert.match(calls[0], /pg_advisory_lock/);
  assert.equal(calls[1], "work");
  assert.match(calls[2], /pg_advisory_unlock/);
});

test("withMigrationLock releases the lock when the work throws", async () => {
  const calls: string[] = [];
  const client = {
    query: async (text: string) => {
      calls.push(text);
      return { rows: [] };
    },
  };

  await assert.rejects(
    withMigrationLock(client, async () => {
      throw new Error("boom");
    }),
    /boom/
  );

  assert.match(calls[calls.length - 1], /pg_advisory_unlock/);
});

test("a failing unlock does not hide the original error", async () => {
  const client = {
    query: async (text: string) => {
      if (text.includes("unlock")) throw new Error("unlock failed");
      return { rows: [] };
    },
  };

  await assert.rejects(
    withMigrationLock(client, async () => {
      throw new Error("boom");
    }),
    /boom/
  );
});
