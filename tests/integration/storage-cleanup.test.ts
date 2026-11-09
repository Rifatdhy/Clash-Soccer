import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const testUrl = process.env.TEST_DATABASE_URL;
const skip = testUrl ? false : "TEST_DATABASE_URL not set";

if (testUrl) {
  process.env.DATABASE_URL = testUrl;
}

const uniqueId = (prefix: string) => `${prefix}-${randomUUID()}`;

test(
  "deleting a news row releases only uploads nothing else references",
  { skip },
  async () => {
    const { query } = await import("../../src/lib/db.ts");
    const { releaseUploadsFor } = await import("../../src/lib/storage-cleanup-server.ts");
    const { putObject } = await import("../../src/lib/storage.ts");

    const dir = join(tmpdir(), `clash-cleanup-${randomUUID()}`);
    const previous = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = dir;

    const newsId = uniqueId("test-news");
    const sharedNewsId = uniqueId("test-news");

    try {
      const owned = await putObject({
        key: `${randomUUID()}.png`,
        body: new Uint8Array([1, 2, 3]),
        contentType: "image/png",
      });
      const shared = await putObject({
        key: `${randomUUID()}.png`,
        body: new Uint8Array([4, 5, 6]),
        contentType: "image/png",
      });

      await query(
        `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
         VALUES ($1, 'Owned', $2, 'c', 'e', $3, '2026-01-01')`,
        [newsId, uniqueId("slug"), owned.url]
      );
      // A second row still points at `shared`, so it must survive cleanup.
      await query(
        `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
         VALUES ($1, 'Shared', $2, 'c', 'e', $3, '2026-01-01')`,
        [sharedNewsId, uniqueId("slug"), shared.url]
      );

      const deleted = await query<{ cover_image: string | null }>(
        "DELETE FROM news WHERE id = $1 RETURNING cover_image",
        [newsId]
      );

      const result = await releaseUploadsFor([deleted.rows[0].cover_image]);

      assert.deepEqual(result.failed, []);
      assert.equal(result.deleted.length, 1);
      assert.equal(existsSync(join(dir, owned.url.replace("/api/uploads/", ""))), false);
      assert.equal(existsSync(join(dir, shared.url.replace("/api/uploads/", ""))), true);
    } finally {
      await query("DELETE FROM news WHERE id = ANY($1)", [[newsId, sharedNewsId]]);
      if (previous === undefined) delete process.env.UPLOAD_DIR;
      else process.env.UPLOAD_DIR = previous;
    }
  }
);

test(
  "an album item url still used by another album item is kept",
  { skip },
  async () => {
    const { query } = await import("../../src/lib/db.ts");
    const { releaseUploadsFor } = await import("../../src/lib/storage-cleanup-server.ts");
    const { putObject } = await import("../../src/lib/storage.ts");

    const dir = join(tmpdir(), `clash-cleanup-${randomUUID()}`);
    const previous = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = dir;

    const albumId = uniqueId("test-album");
    const otherAlbumId = uniqueId("test-album");
    const firstItemId = uniqueId("test-item");
    const secondItemId = uniqueId("test-item");

    try {
      const stored = await putObject({
        key: `${randomUUID()}.png`,
        body: new Uint8Array([7, 8, 9]),
        contentType: "image/png",
      });

      await query(
        "INSERT INTO albums (id, title, match_date, cover_url) VALUES ($1, 'A', '2026-01-01', '')",
        [albumId]
      );
      await query(
        "INSERT INTO albums (id, title, match_date, cover_url) VALUES ($1, 'B', '2026-01-01', '')",
        [otherAlbumId]
      );
      await query(
        "INSERT INTO album_items (id, album_id, type, url) VALUES ($1, $2, 'image', $3)",
        [firstItemId, albumId, stored.url]
      );
      await query(
        "INSERT INTO album_items (id, album_id, type, url) VALUES ($1, $2, 'image', $3)",
        [secondItemId, otherAlbumId, stored.url]
      );

      const deleted = await query<{ url: string | null }>(
        "DELETE FROM album_items WHERE id = $1 RETURNING url",
        [firstItemId]
      );

      const result = await releaseUploadsFor([deleted.rows[0].url]);

      assert.deepEqual(result.deleted, []);
      assert.equal(existsSync(join(dir, stored.url.replace("/api/uploads/", ""))), true);
    } finally {
      await query("DELETE FROM albums WHERE id = ANY($1)", [[albumId, otherAlbumId]]);
      if (previous === undefined) delete process.env.UPLOAD_DIR;
      else process.env.UPLOAD_DIR = previous;
    }
  }
);

test(
  "a replaced cover is released while the new one is kept",
  { skip },
  async () => {
    const { query } = await import("../../src/lib/db.ts");
    const { releaseReplacedUploads } = await import(
      "../../src/lib/storage-cleanup-server.ts"
    );
    const { putObject } = await import("../../src/lib/storage.ts");

    const dir = join(tmpdir(), `clash-cleanup-${randomUUID()}`);
    const previous = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = dir;

    const newsId = uniqueId("test-news");

    try {
      const oldCover = await putObject({
        key: `${randomUUID()}.png`,
        body: new Uint8Array([1]),
        contentType: "image/png",
      });
      const newCover = await putObject({
        key: `${randomUUID()}.png`,
        body: new Uint8Array([2]),
        contentType: "image/png",
      });

      await query(
        `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
         VALUES ($1, 'Replace', $2, 'c', 'e', $3, '2026-01-01')`,
        [newsId, uniqueId("slug"), oldCover.url]
      );

      const before = await query<{ cover_image: string | null }>(
        "SELECT cover_image FROM news WHERE id = $1",
        [newsId]
      );
      await query("UPDATE news SET cover_image = $1 WHERE id = $2", [
        newCover.url,
        newsId,
      ]);

      const result = await releaseReplacedUploads(
        [before.rows[0].cover_image],
        [newCover.url]
      );

      assert.deepEqual(result.failed, []);
      assert.deepEqual(result.deleted, [oldCover.url.replace("/api/uploads/", "")]);
      assert.equal(
        existsSync(join(dir, oldCover.url.replace("/api/uploads/", ""))),
        false
      );
      assert.equal(
        existsSync(join(dir, newCover.url.replace("/api/uploads/", ""))),
        true
      );
    } finally {
      await query("DELETE FROM news WHERE id = $1", [newsId]);
      if (previous === undefined) delete process.env.UPLOAD_DIR;
      else process.env.UPLOAD_DIR = previous;
    }
  }
);
