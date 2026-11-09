/**
 * Enforce a byte cap while reading a request body.
 *
 * A `Content-Length` check is only advisory: a client that streams its body
 * sends `Transfer-Encoding: chunked` and no length at all, so the header guard
 * in `validate()` cannot see the size. Without this the cap is trivially
 * bypassed and `req.json()` still buffers everything.
 *
 * Reading incrementally and giving up as soon as the running total exceeds the
 * cap keeps memory bounded even for a body that never ends.
 */

export type BodyReadResult =
  | { ok: true; text: string }
  | { ok: false; bytes: number };

const decoder = new TextDecoder();

export async function readTextWithinLimit(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number
): Promise<BodyReadResult> {
  if (!body) return { ok: true, text: "" };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      // Count bytes, not characters: a multi-byte character is several bytes
      // of memory even though it reads as one character.
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, bytes: total };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, text: decoder.decode(merged) };
}
