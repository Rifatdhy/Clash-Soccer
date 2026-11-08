import test from "node:test";
import assert from "node:assert/strict";
import { signAwsRequest } from "../src/lib/sigv4.ts";

test("signAwsRequest adds Authorization, x-amz-date, and x-amz-content-sha256", () => {
  const headers = signAwsRequest({
    method: "PUT",
    url: "https://bucket.s3.amazonaws.com/uploads/a.png",
    headers: { "content-type": "image/png" },
    body: new TextEncoder().encode("hello"),
    region: "us-east-1",
    service: "s3",
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "SECRET",
    now: new Date("2026-01-01T00:00:00Z"),
  });

  assert.match(
    headers.authorization,
    /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20260101\/us-east-1\/s3\/aws4_request/
  );
  assert.equal(headers["x-amz-date"], "20260101T000000Z");
  assert.equal(
    headers["x-amz-content-sha256"],
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
  );
});

test("signAwsRequest includes caller headers in SignedHeaders", () => {
  const headers = signAwsRequest({
    method: "PUT",
    url: "https://bucket.s3.amazonaws.com/a.png",
    headers: { "Content-Type": "image/png" },
    region: "us-east-1",
    service: "s3",
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "SECRET",
    now: new Date("2026-01-01T00:00:00Z"),
  });

  assert.match(headers.authorization, /SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date/);
});
