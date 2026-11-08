export interface MigrationFile {
  version: string;
  name: string;
}

const MIGRATION_PATTERN = /^(\d{4})_([A-Za-z0-9_-]+)\.sql$/;

export function parseMigrationFileName(fileName: string): MigrationFile | null {
  const match = MIGRATION_PATTERN.exec(fileName);
  if (!match) return null;
  return { version: match[1], name: match[2] };
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
