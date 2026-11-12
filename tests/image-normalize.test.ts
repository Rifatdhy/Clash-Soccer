import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import { normalizeImage, imageInputOptions, MAX_IMAGE_PIXELS } from "../src/lib/image-normalize.ts";
import { identifyImage } from "../src/lib/validation.ts";

/**
 * A polyglot upload: a real image with a second payload glued on after the
 * image data. Browsers show the image, so the admin sees nothing wrong, while
 * anything that later echoes the raw file serves the payload too.
 */
const PAYLOAD = Buffer.from("<?php system($_GET['c']); ?>");

function contains(haystack: Uint8Array, needle: Uint8Array): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

function withPayload(image: Buffer): Uint8Array {
  return new Uint8Array(Buffer.concat([image, PAYLOAD]));
}

async function sample(format: "png" | "jpeg" | "webp" | "gif"): Promise<Buffer> {
  const base = sharp({
    create: { width: 24, height: 24, channels: 3, background: { r: 200, g: 30, b: 30 } },
  });
  return base[format]().toBuffer();
}

for (const [mime, format] of [
  ["image/png", "png"],
  ["image/jpeg", "jpeg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
] as const) {
  test(`re-encoding a ${mime} drops data appended after the image`, async () => {
    const polyglot = withPayload(await sample(format));

    // Precondition: the file still looks like a valid image by its header.
    assert.equal(identifyImage(polyglot)?.mime, mime);
    assert.equal(contains(polyglot, PAYLOAD), true);

    const clean = await normalizeImage(polyglot, mime);

    assert.equal(contains(clean, PAYLOAD), false);
    assert.equal(identifyImage(clean)?.mime, mime);
  });
}

test("re-encoding keeps the image usable", async () => {
  const clean = await normalizeImage(new Uint8Array(await sample("png")), "image/png");
  const metadata = await sharp(clean).metadata();

  assert.equal(metadata.format, "png");
  assert.equal(metadata.width, 24);
  assert.equal(metadata.height, 24);
});

test("re-encoding rejects a file whose image data cannot be decoded", async () => {
  // A valid JPEG header followed by garbage passes the signature check but has
  // no decodable image. Storing it would put a broken file in the gallery.
  const broken = new Uint8Array(
    Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 0)])
  );
  assert.equal(identifyImage(broken)?.mime, "image/jpeg");
  await assert.rejects(() => normalizeImage(broken, "image/jpeg"));
});

test("image input has an explicit pixel ceiling", () => {
  assert.equal(imageInputOptions("image/gif").animated, true);
  assert.equal(imageInputOptions("image/png").animated, false);
  assert.equal(imageInputOptions("image/jpeg").limitInputPixels, MAX_IMAGE_PIXELS);
});

test("re-encoding applies the exif orientation before dropping the metadata", async () => {
  // Phones store landscape pixels plus an orientation tag instead of rotating
  // the image. Re-encoding without honouring the tag would leave every portrait
  // photo lying on its side.
  const landscape = await sharp({
    create: { width: 40, height: 20, channels: 3, background: { r: 10, g: 80, b: 200 } },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();

  const before = await sharp(landscape).metadata();
  assert.equal(before.orientation, 6);

  const clean = await normalizeImage(new Uint8Array(landscape), "image/jpeg");
  const after = await sharp(clean).metadata();

  // Orientation 6 rotates 90 degrees clockwise, so the sides swap.
  assert.equal(after.width, 20);
  assert.equal(after.height, 40);
  assert.equal(after.orientation, undefined);
});
