import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { query, withTransaction } from "./db";
import { invalidMigrationFiles, selectPendingMigrations } from "./migrations";

const MIGRATIONS_DIR = join(process.cwd(), "migrations");

/**
 * Apply pending migrations from `migrations/` and record them in
 * `schema_migrations`, exactly like `npm run db:migrate`.
 *
 * This used to replay a hand-maintained `src/lib/schema.sql`, which drifted
 * from the migration files (it was missing `rate_limits` and every index) and
 * left `schema_migrations` empty, so a later `db:migrate` would try to apply
 * `0001` on top of an existing schema.
 */
export async function initDatabase(): Promise<{ applied: string[] }> {
  const files = readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith(".sql"));

  const invalid = invalidMigrationFiles(files);
  if (invalid.length > 0) {
    throw new Error(
      `Migration files do not match NNNN_name.sql and would be skipped: ${invalid.join(", ")}`
    );
  }

  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const appliedResult = await query<{ version: string }>(
    "SELECT version FROM schema_migrations ORDER BY version"
  );
  const applied = appliedResult.rows.map((row) => row.version);
  const pending = selectPendingMigrations(files, applied);

  for (const migration of pending) {
    const sql = readFileSync(
      join(MIGRATIONS_DIR, `${migration.version}_${migration.name}.sql`),
      "utf8"
    );

    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [
        migration.version,
      ]);
    });
  }

  return { applied: pending.map((migration) => migration.version) };
}
