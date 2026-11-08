import { mkdir, rm, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { signAwsRequest } from "./sigv4.ts";

export type StorageDriver = "local" | "s3";

export function resolveStorageDriver(
  env: Record<string, string | undefined> = process.env
): StorageDriver {
  return env.STORAGE_DRIVER === "s3" ? "s3" : "local";
}

function getUploadDir(env: Record<string, string | undefined> = process.env): string {
  return env.UPLOAD_DIR?.trim() || join(process.cwd(), ".data", "uploads");
}

function assertSafeKey(key: string): void {
  if (!key || key.startsWith("/") || key.split(/[\\/]/).includes("..")) {
    throw new Error("Invalid storage key");
  }
}

interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
}

function getS3Config(env: Record<string, string | undefined> = process.env): S3Config {
  const required = {
    S3_BUCKET: env.S3_BUCKET,
    S3_REGION: env.S3_REGION,
    S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value?.trim())
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing S3 configuration: ${missing.join(", ")}`);
  }

  return {
    bucket: required.S3_BUCKET!.trim(),
    region: required.S3_REGION!.trim(),
    accessKeyId: required.S3_ACCESS_KEY_ID!.trim(),
    secretAccessKey: required.S3_SECRET_ACCESS_KEY!.trim(),
    endpoint: env.S3_ENDPOINT?.trim() || undefined,
    publicBaseUrl: env.S3_PUBLIC_BASE_URL?.trim() || undefined,
  };
}

function objectUrl(config: S3Config, key: string): string {
  if (config.endpoint) {
    return `${config.endpoint.replace(/\/+$/, "")}/${config.bucket}/${key}`;
  }
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

async function putLocal(input: {
  key: string;
  body: Uint8Array;
}): Promise<{ url: string }> {
  assertSafeKey(input.key);
  const target = join(getUploadDir(), input.key);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, input.body);
  return { url: `/api/uploads/${input.key}` };
}

async function putS3(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<{ url: string }> {
  assertSafeKey(input.key);
  const config = getS3Config();
  const url = objectUrl(config, input.key);
  const headers = signAwsRequest({
    method: "PUT",
    url,
    headers: { "content-type": input.contentType },
    body: input.body,
    region: config.region,
    service: "s3",
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const body = new Uint8Array(input.body);
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: body.buffer,
  });
  if (!response.ok) {
    throw new Error(`S3 upload failed with status ${response.status}`);
  }

  const publicUrl = config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/+$/, "")}/${input.key}`
    : url;
  return { url: publicUrl };
}

export async function putObject(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<{ url: string }> {
  if (resolveStorageDriver() === "s3") {
    return putS3(input);
  }
  return putLocal(input);
}

export async function deleteObject(key: string): Promise<void> {
  assertSafeKey(key);

  if (resolveStorageDriver() !== "s3") {
    const target = join(getUploadDir(), key);
    await rm(target, { force: true });
    return;
  }

  const config = getS3Config();
  const url = objectUrl(config, key);
  const headers = signAwsRequest({
    method: "DELETE",
    url,
    headers: {},
    region: config.region,
    service: "s3",
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const response = await fetch(url, { method: "DELETE", headers });
  if (!response.ok && response.status !== 404) {
    throw new Error(`S3 delete failed with status ${response.status}`);
  }
}
