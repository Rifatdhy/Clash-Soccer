import { createLogger } from "./logger.ts";

const logger = createLogger({ service: "storage-cleanup" });

const UPLOAD_PREFIX = "/api/uploads/";

/**
 * Extract the storage key from an app-served upload URL.
 *
 * Returns `null` for anything the app does not own: external hosts, data
 * URLs, static assets, and keys that could escape the upload directory.
 */
export function storageKeyFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(UPLOAD_PREFIX)) return null;

  const raw = url.slice(UPLOAD_PREFIX.length);
  if (!raw) return null;

  let key: string;
  try {
    key = decodeURIComponent(raw);
  } catch {
    // Malformed percent-encoding: not a key we wrote.
    return null;
  }

  if (key.includes("\\")) return null;
  if (key.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) {
    return null;
  }

  return key;
}

/**
 * Upload URLs that a write replaced and that nothing else points at.
 *
 * An update that swaps a cover image leaves the previous file orphaned just
 * like a delete does. Only values the app actually stores are considered, and
 * a URL that survived the write is not "replaced".
 */
export function replacedUploadUrls(
  previous: Array<string | null | undefined>,
  next: Array<string | null | undefined>
): string[] {
  const stillUsed = new Set(next.filter((url): url is string => Boolean(url)));

  const result: string[] = [];
  const seen = new Set<string>();
  for (const url of previous) {
    if (!url || stillUsed.has(url)) continue;
    if (storageKeyFromUrl(url) === null) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}

/** Columns that can hold an app-served upload URL. */const REFERENCE_SQL = `
  SELECT url FROM (
    SELECT logo_url AS url FROM settings
    UNION ALL SELECT banner_url FROM settings
    UNION ALL SELECT cover_url FROM albums
    UNION ALL SELECT url FROM album_items
    UNION ALL SELECT thumbnail_url FROM album_items
    UNION ALL SELECT cover_image FROM news
  ) refs
  WHERE url = ANY($1)
`;

export interface CleanupDeps {
  query(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: Array<{ url: string | null }> }>;
  deleteObject(key: string): Promise<void>;
}

export interface CleanupResult {
  deleted: string[];
  failed: Array<{ key: string; error: unknown }>;
}

/**
 * Delete uploads that no database row references any more.
 *
 * Called after the owning row is gone, so it must never throw: a cleanup
 * failure has to leave the admin's successful delete successful. When the
 * reference check itself fails nothing is deleted, because deleting a file
 * that is still in use is worse than leaving an orphan on disk.
 */
export async function releaseUploads(
  urls: Array<string | null | undefined>,
  deps: CleanupDeps
): Promise<CleanupResult> {
  const result: CleanupResult = { deleted: [], failed: [] };

  const keys: string[] = [];
  const seen = new Set<string>();
  for (const url of urls) {
    const key = storageKeyFromUrl(url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  if (keys.length === 0) return result;

  const uploadUrls = keys.map((key) => `${UPLOAD_PREFIX}${key}`);

  let stillReferenced: Set<string>;
  try {
    const { rows } = await deps.query(REFERENCE_SQL, [uploadUrls]);
    stillReferenced = new Set(
      rows.map((row) => row.url).filter((url): url is string => Boolean(url))
    );
  } catch (error) {
    logger.error("Skipped upload cleanup because the reference check failed", {
      error,
      keys,
    });
    for (const key of keys) result.failed.push({ key, error });
    return result;
  }

  for (const [index, key] of keys.entries()) {
    if (stillReferenced.has(uploadUrls[index])) continue;
    try {
      await deps.deleteObject(key);
      result.deleted.push(key);
    } catch (error) {
      logger.warn("Failed to delete an unreferenced upload", { error, key });
      result.failed.push({ key, error });
    }
  }

  return result;
}
