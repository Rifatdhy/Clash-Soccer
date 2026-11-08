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
