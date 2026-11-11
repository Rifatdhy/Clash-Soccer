import test from "node:test";
import assert from "node:assert/strict";
import {
  extensionForMime,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_BODY_BYTES,
  ALLOWED_IMAGE_TYPES,
  declaresOversizedBody,
  identifyImage,
} from "../src/lib/validation.ts";

function concat(...parts: Array<string | number[]>): Uint8Array {
  const chunks = parts.map((part) =>
    typeof part === "string" ? new TextEncoder().encode(part) : Uint8Array.from(part)
  );
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0];
const RIFF_HEADER = [0x52, 0x49, 0x46, 0x46];

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

test("identifyImage reads the png signature and returns its extension", () => {
  assert.deepEqual(identifyImage(concat(PNG_HEADER, [0x00, 0x00, 0x00, 0x0d])), {
    mime: "image/png",
    extension: "png",
  });
});

test("identifyImage reads the jpeg signature and returns its extension", () => {
  assert.deepEqual(identifyImage(concat(JPEG_HEADER, [0x00, 0x10])), {
    mime: "image/jpeg",
    extension: "jpg",
  });
});

test("identifyImage accepts both gif signatures", () => {
  for (const version of ["GIF87a", "GIF89a"]) {
    assert.deepEqual(identifyImage(concat(version, [0x01, 0x00, 0x01, 0x00])), {
      mime: "image/gif",
      extension: "gif",
    });
  }
});

test("identifyImage requires both RIFF and WEBP for a webp file", () => {
  assert.deepEqual(
    identifyImage(concat(RIFF_HEADER, [0x24, 0x00, 0x00, 0x00], "WEBPVP8 ")),
    { mime: "image/webp", extension: "webp" }
  );
});

test("identifyImage rejects a RIFF container that is not webp", () => {
  // A WAV file starts the same way; only the bytes at offset 8 tell them apart.
  assert.equal(
    identifyImage(concat(RIFF_HEADER, [0x24, 0x00, 0x00, 0x00], "WAVEfmt ")),
    null
  );
});

test("identifyImage rejects non-image payloads that claim to be images", () => {
  const payloads = [
    "<svg xmlns=\"http://www.w3.org/2000/svg\"><script /></svg>",
    "<!DOCTYPE html><html><body>hi</body></html>",
    "%PDF-1.7\n",
    "<?php echo 1; ?>",
    "GIF8",
    "not an image at all",
  ];
  for (const payload of payloads) {
    assert.equal(identifyImage(concat(payload)), null, payload);
  }
});

test("identifyImage rejects empty and truncated buffers", () => {
  assert.equal(identifyImage(new Uint8Array(0)), null);
  assert.equal(identifyImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), null);
  assert.equal(identifyImage(Uint8Array.from([0xff, 0xd8])), null);
});
