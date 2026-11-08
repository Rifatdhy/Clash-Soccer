import { readFileSync, readdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import {
  invalidMigrationFiles,
  selectPendingMigrations,
} from "../src/lib/migrations.ts";

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

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("FATAL: DATABASE_URL environment variable must be set.");
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";
const ssl = connectionString.includes("sslmode=disable")
  ? false
  : isProduction
    ? { rejectUnauthorized: process.env.PG_REJECT_UNAUTHORIZED !== "false" }
    : false;

const statusOnly = process.argv.includes("--status");
const dryRun = process.argv.includes("--dry-run");

const migrationsDir = join(rootDir, "migrations");
const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql"));

const invalid = invalidMigrationFiles(files);
if (invalid.length > 0) {
  console.error(
    `FATAL: these migration files do not match NNNN_name.sql and would be skipped: ${invalid.join(", ")}`
  );
  process.exit(1);
}

const MIGRATION_LOCK_ID = 4829163;

const client = new pg.Client({ connectionString, ssl });
await client.connect();

try {
  // Two instances deploying at once must not apply the same DDL twice.
  await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const appliedResult = await client.query(
    "SELECT version, applied_at FROM schema_migrations ORDER BY version"
  );
  const applied = appliedResult.rows.map((row) => row.version);

  const pending = selectPendingMigrations(files, applied);

  if (statusOnly) {
    if (appliedResult.rows.length === 0) {
      console.log("No migrations applied.");
    } else {
      for (const row of appliedResult.rows) {
        console.log(`Applied ${row.version} at ${row.applied_at.toISOString()}`);
      }
    }
  } else if (dryRun) {
    if (pending.length === 0) {
      console.log("No pending migrations.");
    } else {
      for (const migration of pending) {
        console.log(`Pending ${migration.version}_${migration.name}`);
      }
    }
  } else if (pending.length === 0) {
    console.log("No pending migrations.");
  } else {
    for (const migration of pending) {
      const fileName = `${migration.version}_${migration.name}.sql`;
      const sql = readFileSync(join(migrationsDir, fileName), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [
          migration.version,
        ]);
        await client.query("COMMIT");
        console.log(`Applied ${fileName}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    console.log(`Applied ${pending.length} migration(s).`);
  }
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(() => {});
  await client.end();
}
