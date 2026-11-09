import test from "node:test";
import assert from "node:assert/strict";
import {
  extensionForMime,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_BODY_BYTES,
  ALLOWED_IMAGE_TYPES,
  declaresOversizedBody,
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

test("a declared body larger than the cap is rejected before it is read", () => {
  assert.equal(declaresOversizedBody(String(MAX_UPLOAD_BODY_BYTES + 1)), true);
  assert.equal(declaresOversizedBody(String(MAX_UPLOAD_BODY_BYTES)), false);
});

test("multipart overhead is allowed on top of the file cap", () => {
  assert.ok(MAX_UPLOAD_BODY_BYTES > MAX_UPLOAD_BYTES);
  assert.equal(declaresOversizedBody(String(MAX_UPLOAD_BYTES)), false);
});

test("a missing or unparseable content-length is not treated as oversized", () => {
  // Browsers always send it for multipart, but a proxy may strip it. The file
  // size check still runs afterwards, so this must not reject the request.
  assert.equal(declaresOversizedBody(null), false);
  assert.equal(declaresOversizedBody(""), false);
  assert.equal(declaresOversizedBody("not-a-number"), false);
  assert.equal(declaresOversizedBody("-5"), false);
});

test("a content-length just under the cap is allowed", () => {
  assert.equal(declaresOversizedBody(String(MAX_UPLOAD_BODY_BYTES - 1)), false);
});
