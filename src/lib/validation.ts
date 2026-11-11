/**
 * Shared validation rules. No server-only imports, so the admin UI can
 * validate the same way the API does.
 */

export const ALLOWED_IMAGE_HOSTS = [
  "lh3.googleusercontent.com",
  "images.unsplash.com",
] as const;

const DATA_IMAGE_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;

/**
 * Hard cap for browser-compressed uploads. The admin UI compresses to well
 * below this; the server rejects anything larger so a crafted request cannot
 * store an unbounded blob.
 */
export const MAX_IMAGE_DATA_URL_LENGTH = 2_000_000;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Cap for JSON request bodies. Route handlers have no default limit, so
 * `req.json()` would buffer whatever a client sends. This is generous for the
 * admin forms and still bounded.
 *
 * It must stay above `MAX_IMAGE_DATA_URL_LENGTH`: when the upload API is
 * unavailable, `uploadImageFile` falls back to returning a data URL that is
 * then saved inside a JSON body. A body cap below the image limit would reject
 * a value the validator explicitly accepts, and the admin would see a 413 with
 * no way to tell why.
 */
export const MAX_JSON_BODY_BYTES = 3 * 1024 * 1024;

/**
 * True when a declared `Content-Length` is larger than `maxBytes`.
 *
 * A missing or unparseable header returns false: the request still gets
 * validated, and a proxy that strips the header must not break the API.
 */
export function exceedsByteLimit(
  contentLength: string | null,
  maxBytes: number
): boolean {
  if (contentLength === null) return false;
  const declared = Number(contentLength.trim());
  if (!Number.isFinite(declared) || declared <= 0) return false;
  return declared > maxBytes;
}

/**
 * `Content-Length` covers the whole multipart envelope, not just the file, so
 * it needs headroom over `MAX_UPLOAD_BYTES` or a legal 5 MB image would be
 * rejected on the header check alone.
 */
export const MAX_UPLOAD_BODY_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024;

/**
 * True when the declared request body is too large to even parse.
 *
 * `request.formData()` buffers the whole body, so checking `file.size`
 * afterwards means a 100 MB body is already in memory before it is rejected.
 * A missing or unparseable header returns false: the file size check still
 * runs, and a proxy that strips the header must not break uploads.
 */
export function declaresOversizedBody(contentLength: string | null): boolean {
  return exceedsByteLimit(contentLength, MAX_UPLOAD_BODY_BYTES);
}

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extensionForMime(mime: string): string | null {
  return MIME_EXTENSIONS[mime] ?? null;
}

export type ImageMime = (typeof ALLOWED_IMAGE_TYPES)[number];

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
// "RIFF" + 4 size bytes + "WEBP"
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];

function matchesAt(bytes: Uint8Array, signature: number[], offset: number): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Identify an image from its leading bytes instead of the browser-supplied
 * `File.type`, which is attacker-controlled. Returns null for anything that is
 * not a PNG, JPEG, GIF, or WebP file, including truncated and disguised
 * payloads.
 */
export function identifyImage(
  bytes: Uint8Array
): { mime: ImageMime; extension: string } | null {
  let mime: ImageMime | null = null;

  if (matchesAt(bytes, PNG_SIGNATURE, 0)) {
    mime = "image/png";
  } else if (matchesAt(bytes, JPEG_SIGNATURE, 0)) {
    mime = "image/jpeg";
  } else if (
    matchesAt(bytes, [...new TextEncoder().encode("GIF87a")], 0) ||
    matchesAt(bytes, [...new TextEncoder().encode("GIF89a")], 0)
  ) {
    mime = "image/gif";
  } else if (
    matchesAt(bytes, RIFF_SIGNATURE, 0) &&
    matchesAt(bytes, WEBP_SIGNATURE, 8)
  ) {
    mime = "image/webp";
  }

  if (!mime) return null;

  const extension = extensionForMime(mime);
  return extension ? { mime, extension } : null;
}

export function isDataImageUrl(value: string): boolean {
  return DATA_IMAGE_PATTERN.test(value);
}

/** Video and outbound links are not restricted to the image hosts. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Images may be uploaded (data URL) or hosted on a configured host.
 * Empty string is allowed because all image fields are optional.
 */
export function isAllowedImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;

  if (trimmed.startsWith("/api/uploads/")) {
    const key = trimmed.slice("/api/uploads/".length);
    return key.length > 0 && !key.includes("..") && !key.includes("\\");
  }

  if (isDataImageUrl(trimmed)) {
    return trimmed.length <= MAX_IMAGE_DATA_URL_LENGTH;
  }

  try {
    const url = new URL(trimmed);
    return (
      url.protocol === "https:" &&
      (ALLOWED_IMAGE_HOSTS as readonly string[]).includes(url.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Only same-origin paths are valid post-login destinations.
 * Blocks `https://evil.example`, `//evil.example`, and `javascript:`.
 */
export function sanitizeNextPath(
  next: string | null | undefined,
  fallback = "/admin"
): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;

  try {
    const base = "http://clash-soccer.local";
    const parsed = new URL(next, base);
    if (parsed.origin !== base) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
