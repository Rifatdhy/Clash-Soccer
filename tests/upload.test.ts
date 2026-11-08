import test from "node:test";
import assert from "node:assert/strict";
import {
  extensionForMime,
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "../src/lib/validation.ts";

test("extensionForMime accepts common raster image types", () => {
  assert.equal(extensionForMime("image/png"), "png");
  assert.equal(extensionForMime("image/jpeg"), "jpg");
  assert.equal(extensionForMime("image/webp"), "webp");
});

test("extensionForMime rejects non-image and vector types", () => {
  assert.equal(extensionForMime("image/svg+xml"), null);
  assert.equal(extensionForMime("text/html"), null);
  assert.equal(extensionForMime("application/pdf"), null);
});

test("upload size cap is five megabytes and matches the allowlist", () => {
  assert.equal(MAX_UPLOAD_BYTES, 5 * 1024 * 1024);
  assert.ok(ALLOWED_IMAGE_TYPES.includes("image/png"));
  assert.ok(!(ALLOWED_IMAGE_TYPES as readonly string[]).includes("image/svg+xml"));
});
