import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Participant } from "../../src/types";

const testUrl = process.env.TEST_DATABASE_URL;
const skip = testUrl ? false : "TEST_DATABASE_URL not set";

if (testUrl) {
  process.env.DATABASE_URL = testUrl;
}

const uniqueId = (prefix: string) => `${prefix}-${randomUUID()}`;

function participant(whatsapp: string): Participant {
  return { name: "Integration Test", whatsapp, jerseySize: "M" };
}

async function insertMatch(slotsTotal: number, slotsAvailable: number) {
  const { query } = await import("../../src/lib/db.ts");
  const id = uniqueId("test-match");
  await query(
    `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, "Integration Match", "2026-01-01", "10:00", "Lapangan", slotsTotal, slotsAvailable]
  );
  return id;
}

async function insertMatchWithStatus(status: "upcoming" | "ongoing" | "completed") {
  const { query } = await import("../../src/lib/db.ts");
  const id = uniqueId("test-match");
  await query(
    `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, "Status Match", "2026-01-01", "10:00", "Lapangan", 10, 10, status]
  );
  return id;
}

async function getSlots(matchId: string) {
  const { query } = await import("../../src/lib/db.ts");
  const { rows } = await query<{ slots_available: number }>(
    "SELECT slots_available FROM matches WHERE id = $1",
    [matchId]
  );
  return rows[0].slots_available;
}

async function cleanup(matchId: string) {
  const { query } = await import("../../src/lib/db.ts");
  await query("DELETE FROM matches WHERE id = $1", [matchId]);
}

test("createRsvp decrements available slots", { skip }, async () => {
  const { createRsvp } = await import("../../src/lib/rsvp-service.ts");
  const matchId = await insertMatch(10, 10);

  try {
    const result = await createRsvp({
      matchId,
      participants: [participant("6281234567890")],
    });

    assert.equal(result.kind, "ok");
    assert.equal(await getSlots(matchId), 9);
  } finally {
    await cleanup(matchId);
  }
});

test("createRsvp rejects duplicate WhatsApp numbers inside one request", { skip }, async () => {
  const { createRsvp } = await import("../../src/lib/rsvp-service.ts");
  const matchId = await insertMatch(10, 10);

  try {
    const result = await createRsvp({
      matchId,
      participants: [participant("6281234567891"), participant("6281234567891")],
    });

    assert.equal(result.kind, "duplicate");
    assert.deepEqual(result.kind === "duplicate" ? result.duplicates : [], ["6281234567891"]);
    assert.equal(await getSlots(matchId), 10);
  } finally {
    await cleanup(matchId);
  }
});

test("createRsvp rejects a full match", { skip }, async () => {
  const { createRsvp } = await import("../../src/lib/rsvp-service.ts");
  const matchId = await insertMatch(1, 1);

  try {
    const result = await createRsvp({
      matchId,
      participants: [participant("6281234567892"), participant("6281234567893")],
    });

    assert.equal(result.kind, "no_slots");
    assert.equal(await getSlots(matchId), 1);
  } finally {
    await cleanup(matchId);
  }
});

test("createRsvp returns not_found for an unknown match", { skip }, async () => {
  const { createRsvp } = await import("../../src/lib/rsvp-service.ts");
  const result = await createRsvp({
    matchId: uniqueId("missing-match"),
    participants: [participant("6281234567894")],
  });

  assert.equal(result.kind, "not_found");
});

test("deleteRsvp restores slots and reports a missing id", { skip }, async () => {
  const { createRsvp, deleteRsvp } = await import("../../src/lib/rsvp-service.ts");
  const matchId = await insertMatch(10, 10);

  try {
    const created = await createRsvp({
      matchId,
      participants: [participant("6281234567895"), participant("6281234567896")],
    });
    assert.equal(created.kind, "ok");
    assert.equal(await getSlots(matchId), 8);

    if (created.kind !== "ok") return;

    assert.deepEqual(await deleteRsvp(created.id), { kind: "ok" });
    assert.equal(await getSlots(matchId), 10);
    assert.deepEqual(await deleteRsvp(created.id), { kind: "not_found" });
  } finally {
    await cleanup(matchId);
  }
});

test("createRsvp rejects a completed match without changing slots", { skip }, async () => {
  const { createRsvp } = await import("../../src/lib/rsvp-service.ts");
  const matchId = await insertMatchWithStatus("completed");

  try {
    const result = await createRsvp({
      matchId,
      participants: [participant("6281234567897")],
    });
    assert.equal(result.kind, "closed");
    assert.equal(await getSlots(matchId), 10);
  } finally {
    await cleanup(matchId);
  }
});

test("createRsvp rejects an ongoing match without changing slots", { skip }, async () => {
  const { createRsvp } = await import("../../src/lib/rsvp-service.ts");
  const matchId = await insertMatchWithStatus("ongoing");

  try {
    const result = await createRsvp({
      matchId,
      participants: [participant("6281234567898")],
    });
    assert.equal(result.kind, "closed");
    assert.equal(await getSlots(matchId), 10);
  } finally {
    await cleanup(matchId);
  }
});
