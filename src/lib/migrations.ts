export interface MigrationFile {
  version: string;
  name: string;
}

/**
 * Advisory lock shared by `npm run db:migrate` and the `/api/db-init` route.
 * Both entry points apply the same DDL, so they must serialize on the same
 * lock id; if they drifted apart two deploys could race.
 */
export const MIGRATION_LOCK_ID = 4829163;

interface LockClient {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

/**
 * Run `work` while holding the migration advisory lock on `client`.
 *
 * The lock lives on the connection, so `client` must be a single dedicated
 * connection rather than the shared pool. The unlock is best-effort: a
 * dropped connection already released the lock server-side, and a failing
 * unlock must not replace the real error.
 */
export async function withMigrationLock<T>(
  client: LockClient,
  work: () => Promise<T>
): Promise<T> {
  await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);

  try {
    return await work();
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(
      () => {}
    );
  }
}

const MIGRATION_PATTERN = /^(\d+)_([A-Za-z0-9_-]+)\.sql$/;

export function parseMigrationFileName(fileName: string): MigrationFile | null {
  const match = MIGRATION_PATTERN.exec(fileName);
  if (!match) return null;
  return { version: match[1], name: match[2] };
}

export function invalidMigrationFiles(files: string[]): string[] {
  return files
    .filter((file) => file.endsWith(".sql") && parseMigrationFileName(file) === null)
    .sort();
}

export function selectPendingMigrations(
  files: string[],
  applied: string[]
): MigrationFile[] {
  const appliedVersions = new Set(applied);

  return files
    .map(parseMigrationFileName)
    .filter((migration): migration is MigrationFile => migration !== null)
    .filter((migration) => !appliedVersions.has(migration.version))
    .sort((a, b) => a.version.localeCompare(b.version));
}
