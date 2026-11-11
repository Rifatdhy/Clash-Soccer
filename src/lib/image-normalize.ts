import sharp from "sharp";
import type { ImageMime } from "./validation.ts";

/**
 * Re-encode an uploaded image from its decoded pixels instead of storing the
 * bytes the client sent.
 *
 * Signature sniffing (`identifyImage`) proves the first bytes look like an
 * image, but says nothing about the rest of the file. A "polyglot" upload can
 * append arbitrary data after a valid image and still render in a browser.
 * Decoding and re-encoding keeps only what the image actually contains, so
 * trailing payloads, embedded scripts, and stale EXIF metadata and comments
 * are all dropped.
 *
 * Throws when the file cannot be decoded; callers turn that into a 400.
 */
export async function normalizeImage(
  bytes: Uint8Array,
  mime: ImageMime
): Promise<Uint8Array> {
  // Animated GIFs need `animated` or sharp keeps only the first frame.
  // `rotate()` with no angle applies the EXIF orientation to the pixels before
  // the tag is dropped, so portrait photos do not come back sideways.
  const input = sharp(bytes, { animated: mime === "image/gif" }).rotate();

  const pipeline =
    mime === "image/png"
      ? input.png({ compressionLevel: 9 })
      : mime === "image/jpeg"
        ? input.jpeg({ quality: 82, mozjpeg: true })
        : mime === "image/webp"
          ? input.webp({ quality: 82 })
          : input.gif({ effort: 7 });

  const { data } = await pipeline.toBuffer({ resolveWithObject: true });
  // Copy out of sharp's Buffer so the caller owns a plain ArrayBuffer view,
  // which is what `BodyInit` and `putObject` expect.
  return new Uint8Array(data);
}
