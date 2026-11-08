import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(rootDir, ".env.local"));
loadEnvFile(join(rootDir, ".env"));

if (!process.env.DATABASE_URL) {
  console.log("SKIP: DATABASE_URL not set. Start Postgres with docker compose up -d.");
  process.exit(2);
}

const migrate = spawnSync(process.execPath, [join(__dirname, "migrate.mjs")], {
  stdio: "inherit",
});
if (migrate.status !== 0) {
  console.error("SMOKE FAILED: migrations did not run.");
  process.exit(1);
}

const { query } = await import("../src/lib/db.ts");
const { createRsvp } = await import("../src/lib/rsvp-service.ts");

const matchId = `smoke-${randomUUID()}`;
const whatsapp = "6280000000001";

async function slotsAvailable() {
  const { rows } = await query(
    "SELECT slots_available FROM matches WHERE id = $1",
    [matchId]
  );
  return rows[0]?.slots_available;
}

try {
  await query(
    `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [matchId, "Smoke Match", "2026-01-01", "10:00", "Lapangan", 10, 10]
  );

  const created = await createRsvp({
    matchId,
    participants: [{ name: "Smoke Test", whatsapp, jerseySize: "M" }],
  });
  if (created.kind !== "ok") {
    throw new Error(`Expected ok, got ${created.kind}`);
  }
  if ((await slotsAvailable()) !== 9) {
    throw new Error("Slots were not decremented.");
  }

  const duplicate = await createRsvp({
    matchId,
    participants: [{ name: "Smoke Test", whatsapp, jerseySize: "M" }],
  });
  if (duplicate.kind !== "duplicate") {
    throw new Error(`Expected duplicate, got ${duplicate.kind}`);
  }
  if ((await slotsAvailable()) !== 9) {
    throw new Error("Duplicate RSVP changed the slots.");
  }

  console.log("SMOKE OK");
} catch (error) {
  console.error("SMOKE FAILED:", error);
  process.exitCode = 1;
} finally {
  await query("DELETE FROM matches WHERE id = $1", [matchId]);
  const { default: pool } = await import("../src/lib/db.ts");
  await pool.end();
}
