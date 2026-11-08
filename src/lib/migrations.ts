export interface MigrationFile {
  version: string;
  name: string;
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
