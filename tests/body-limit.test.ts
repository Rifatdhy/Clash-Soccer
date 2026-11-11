import test from "node:test";
import assert from "node:assert/strict";

import {
  readBytesWithinLimit,
  readTextWithinLimit,
} from "../src/lib/body-limit.ts";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[index]));
      index += 1;
    },
  });
}

test("a body under the cap is read whole", async () => {
  const result = await readTextWithinLimit(streamOf(["hello ", "world"]), 100);
  assert.equal(result.ok, true);
  assert.equal(result.ok === true ? result.text : "", "hello world");
});

test("a body exactly at the cap is still accepted", async () => {
  const result = await readTextWithinLimit(streamOf(["12345"]), 5);
  assert.equal(result.ok, true);
});

test("a body over the cap is refused even when it arrives in small chunks", async () => {
  // This is the chunked case: no Content-Length header exists, so a header
  // check cannot see the size. The limit has to be enforced while reading.
  const result = await readTextWithinLimit(streamOf(["123", "456", "789"]), 5);
  assert.equal(result.ok, false);
});

test("a single oversized chunk is refused", async () => {
  const result = await readTextWithinLimit(streamOf(["x".repeat(1000)]), 10);
  assert.equal(result.ok, false);
});

test("an absent body reads as an empty string", async () => {
  const result = await readTextWithinLimit(null, 10);
  assert.equal(result.ok, true);
  assert.equal(result.ok === true ? result.text : "oops", "");
});

test("multi-byte characters are counted in bytes, not characters", async () => {
  // "é" is two bytes in UTF-8. Ten of them are 20 bytes and must not fit a
  // 10-byte cap just because there are only ten characters.
  const result = await readTextWithinLimit(streamOf(["éééééééééé"]), 10);
  assert.equal(result.ok, false);
});

function byteStream(chunks: Uint8Array[], onPull?: () => void): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      onPull?.();
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(chunks[index]);
      index += 1;
    },
  });
}

test("readBytesWithinLimit returns the exact bytes under the cap", async () => {
  const result = await readBytesWithinLimit(
    byteStream([Uint8Array.from([0x89, 0x50]), Uint8Array.from([0x0d, 0x0a])]),
    10
  );
  assert.deepEqual(result, { ok: true, bytes: Uint8Array.from([0x89, 0x50, 0x0d, 0x0a]) });
});

test("readBytesWithinLimit accepts a body exactly at the cap", async () => {
  const result = await readBytesWithinLimit(byteStream([Uint8Array.from([1, 2, 3])]), 3);
  assert.equal(result.ok, true);
});

test("readBytesWithinLimit refuses a chunked body that grows past the cap", async () => {
  const chunks = Array.from({ length: 50 }, () => Uint8Array.from([1, 2, 3]));
  const result = await readBytesWithinLimit(byteStream(chunks), 5);
  assert.deepEqual(result, { ok: false, bytes: 6 });
});

test("readBytesWithinLimit stops reading once the cap is passed", async () => {
  // A body that never ends must not be drained: otherwise the cap only limits
  // what is kept in memory, not how long the request ties up the server.
  let pulls = 0;
  const chunks = Array.from({ length: 100 }, () => Uint8Array.from([1, 2, 3]));
  await readBytesWithinLimit(
    byteStream(chunks, () => {
      pulls += 1;
    }),
    5
  );
  assert.ok(pulls <= 2, `expected at most 2 pulls, got ${pulls}`);
});

test("readBytesWithinLimit treats an absent body as empty", async () => {
  const result = await readBytesWithinLimit(null, 10);
  assert.deepEqual(result, { ok: true, bytes: new Uint8Array(0) });
});
