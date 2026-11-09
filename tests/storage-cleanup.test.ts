import test from "node:test";
import assert from "node:assert/strict";
import {
  releaseUploads,
  replacedUploadUrls,
  storageKeyFromUrl,
  type CleanupDeps,
} from "../src/lib/storage-cleanup.ts";

test("storageKeyFromUrl reads the key out of an app upload url", () => {
  assert.equal(storageKeyFromUrl("/api/uploads/abc.png"), "abc.png");
  assert.equal(storageKeyFromUrl("/api/uploads/2026/abc.webp"), "2026/abc.webp");
});

test("storageKeyFromUrl ignores anything the app does not store", () => {
  for (const url of [
    null,
    undefined,
    "",
    "https://images.unsplash.com/photo-123",
    "data:image/png;base64,AAAA",
    "/logo.png",
    "not a url",
  ]) {
    assert.equal(storageKeyFromUrl(url), null);
  }
});

test("storageKeyFromUrl refuses keys that could escape the upload directory", () => {
  assert.equal(storageKeyFromUrl("/api/uploads/"), null);
  assert.equal(storageKeyFromUrl("/api/uploads/../secret.png"), null);
  assert.equal(storageKeyFromUrl("/api/uploads/a/../../secret.png"), null);
  assert.equal(storageKeyFromUrl("/api/uploads/..%2Fsecret.png"), null);
  assert.equal(storageKeyFromUrl("/api/uploads/a\\..\\b.png"), null);
});

function deps(overrides: Partial<CleanupDeps> = {}): CleanupDeps & {
  deleted: string[];
  queried: string[][];
} {
  const deleted: string[] = [];
  const queried: string[][] = [];
  return {
    deleted,
    queried,
    query: async (_text: string, params?: unknown[]) => {
      queried.push((params?.[0] as string[]) ?? []);
      return { rows: [] };
    },
    deleteObject: async (key: string) => {
      deleted.push(key);
    },
    ...overrides,
  };
}

test("releaseUploads deletes uploads nothing else references", async () => {
  const d = deps();

  const result = await releaseUploads(["/api/uploads/a.png"], d);

  assert.deepEqual(result.deleted, ["a.png"]);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(d.deleted, ["a.png"]);
});

test("releaseUploads keeps an upload that another row still uses", async () => {
  const d = deps({
    query: async () => ({ rows: [{ url: "/api/uploads/shared.png" }] }),
  });

  const result = await releaseUploads(["/api/uploads/shared.png"], d);

  assert.deepEqual(result.deleted, []);
  assert.deepEqual(d.deleted, []);
});

test("releaseUploads skips urls the app does not own", async () => {
  const d = deps();

  const result = await releaseUploads(
    ["https://images.unsplash.com/photo-1", "data:image/png;base64,AA", ""],
    d
  );

  assert.deepEqual(result.deleted, []);
  assert.deepEqual(d.deleted, []);
  assert.equal(d.queried.length, 0);
});

test("releaseUploads deduplicates repeated urls", async () => {
  const d = deps();

  await releaseUploads(
    ["/api/uploads/a.png", "/api/uploads/a.png", "/api/uploads/b.png"],
    d
  );

  assert.deepEqual(d.deleted, ["a.png", "b.png"]);
  assert.deepEqual(d.queried[0], ["/api/uploads/a.png", "/api/uploads/b.png"]);
});

test("a failed delete is reported instead of thrown", async () => {
  // Cleanup runs after the database row is already gone. Throwing here would
  // turn a successful delete into a 500 for the admin.
  const d = deps({
    deleteObject: async () => {
      throw new Error("disk full");
    },
  });

  const result = await releaseUploads(["/api/uploads/a.png"], d);

  assert.deepEqual(result.deleted, []);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].key, "a.png");
});

test("a failed reference lookup deletes nothing", async () => {
  const d = deps({
    query: async () => {
      throw new Error("database down");
    },
  });

  const result = await releaseUploads(["/api/uploads/a.png"], d);

  assert.deepEqual(result.deleted, []);
  assert.deepEqual(d.deleted, []);
});

test("replacedUploadUrls returns the uploads that a write no longer uses", () => {
  assert.deepEqual(
    replacedUploadUrls(["/api/uploads/old.png"], ["/api/uploads/new.png"]),
    ["/api/uploads/old.png"]
  );
});

test("replacedUploadUrls keeps an upload that is still referenced", () => {
  assert.deepEqual(
    replacedUploadUrls(
      ["/api/uploads/keep.png", "/api/uploads/gone.png"],
      ["/api/uploads/keep.png"]
    ),
    ["/api/uploads/gone.png"]
  );
});

test("replacedUploadUrls ignores unchanged values and non-app urls", () => {
  assert.deepEqual(
    replacedUploadUrls(
      ["https://images.unsplash.com/a", "", null],
      ["https://images.unsplash.com/a", "", null]
    ),
    []
  );
});

test("replacedUploadUrls treats an unchanged upload as not replaced", () => {
  assert.deepEqual(
    replacedUploadUrls(["/api/uploads/same.png"], ["/api/uploads/same.png"]),
    []
  );
});
