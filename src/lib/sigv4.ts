import { createHash, createHmac } from "node:crypto";

const ALGORITHM = "AWS4-HMAC-SHA256";

type HmacKey = string | Buffer;

function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: HmacKey, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function canonicalQuery(search: URLSearchParams): string {
  return [...search.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

export function signAwsRequest(input: {
  method: string;
  url: string;
  headers: Record<string, string>;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  now?: Date;
  body?: Uint8Array;
}): Record<string, string> {
  const url = new URL(input.url);
  const now = input.now ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(input.body ?? new Uint8Array());

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.headers)) {
    headers[key.toLowerCase()] = value.trim();
  }
  headers.host = url.host;
  headers["x-amz-content-sha256"] = payloadHash;
  headers["x-amz-date"] = amzDate;

  const headerNames = Object.keys(headers).sort();
  const canonicalHeaders = headerNames
    .map((name) => `${name}:${headers[name]}\n`)
    .join("");
  const signedHeaders = headerNames.join(";");

  const canonicalRequest = [
    input.method.toUpperCase(),
    url.pathname || "/",
    canonicalQuery(url.searchParams),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const stringToSign = [
    ALGORITHM,
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${input.secretAccessKey}`, dateStamp), input.region), input.service),
    "aws4_request"
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  headers.authorization = `${ALGORITHM} Credential=${input.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}
