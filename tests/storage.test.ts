import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { resolveStorageDriver, putObject, deleteObject } from "../src/lib/storage.ts";

test("resolveStorageDriver defaults to local and accepts s3", () => {
  assert.equal(resolveStorageDriver({}), "local");
  assert.equal(resolveStorageDriver({ STORAGE_DRIVER: "s3" }), "s3");
  assert.equal(resolveStorageDriver({ STORAGE_DRIVER: "weird" }), "local");
});

test("local driver writes and deletes an object", async () => {
  const dir = join(tmpdir(), `clash-storage-${randomUUID()}`);
  const previous = process.env.UPLOAD_DIR;
  process.env.UPLOAD_DIR = dir;

  try {
    const body = new Uint8Array([1, 2, 3]);
    const { url } = await putObject({ key: "a.png", body, contentType: "image/png" });

    assert.equal(url, "/api/uploads/a.png");
    assert.deepEqual(new Uint8Array(readFileSync(join(dir, "a.png"))), body);

    await deleteObject("a.png");
    assert.equal(existsSync(join(dir, "a.png")), false);
  } finally {
    if (previous === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = previous;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("local driver rejects traversal keys", async () => {
  await assert.rejects(
    putObject({ key: "../escape.png", body: new Uint8Array([1]), contentType: "image/png" }),
    /Invalid storage key/
  );
});
