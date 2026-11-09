import { query } from "./db.ts";
import { deleteObject } from "./storage.ts";
import {
  releaseUploads,
  replacedUploadUrls,
  type CleanupResult,
} from "./storage-cleanup.ts";

/**
 * Best-effort removal of upload files whose database rows are already gone.
 *
 * Routes call this *after* the row is deleted and never await a failure: the
 * admin's delete succeeded, so a storage hiccup must not turn it into a 500.
 * `releaseUploads` re-checks every candidate against the database first, so a
 * URL still used by another row is kept.
 */
export async function releaseUploadsFor(
  urls: Array<string | null | undefined>
): Promise<CleanupResult> {
  try {
    return await releaseUploads(urls, {
      query: (text, params) => query<{ url: string | null }>(text, params),
      deleteObject,
    });
  } catch (error) {
    // `releaseUploads` already swallows its own failures; this is a last
    // resort so a bug in cleanup can never break the request.
    return { deleted: [], failed: [{ key: "(unknown)", error }] };
  }
}

/**
 * Remove uploads that an update replaced. Same guarantees as
 * `releaseUploadsFor`: it never throws, and a file still referenced elsewhere
 * is kept.
 */
export async function releaseReplacedUploads(
  previous: Array<string | null | undefined>,
  next: Array<string | null | undefined>
): Promise<CleanupResult> {
  return releaseUploadsFor(replacedUploadUrls(previous, next));
}
