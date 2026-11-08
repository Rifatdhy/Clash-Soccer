import { query } from "./db.ts";
import {
  createMemoryStore,
  createPostgresStore,
  type RateLimitOptions,
  type RateLimitStore,
} from "./rate-limit-store.ts";

export type { RateLimitOptions } from "./rate-limit-store.ts";

export const RATE_LIMIT_DEFAULTS: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 5,
};

export const RSVP_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 20,
};

let configuredStore: RateLimitStore = createMemoryStore();
const fallbackStore = createMemoryStore();
let databaseStore: RateLimitStore | null = null;

export function setRateLimitStore(store: RateLimitStore) {
  configuredStore = store;
  databaseStore = null;
}

function getStore(): RateLimitStore {
  if (process.env.RATE_LIMIT_STORE !== "database") {
    return configuredStore;
  }

  databaseStore ??= createPostgresStore((text, params) => query(text, params));
  return databaseStore;
}

export async function consume(
  scope: string,
  key: string,
  options: RateLimitOptions = RATE_LIMIT_DEFAULTS
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const bucketKey = `${scope}:${key}`;

  try {
    return await getStore().consume(bucketKey, options);
  } catch (error) {
    // A broken shared store must not take the whole API down. Fall back to
    // per-instance counters and let the operator investigate the logs.
    console.error("Rate limit store unavailable; using in-memory fallback", error);
    return fallbackStore.consume(bucketKey, options);
  }
}

export async function resetRateLimit(scope: string, key: string) {
  const bucketKey = `${scope}:${key}`;

  try {
    await getStore().reset(bucketKey);
  } catch (error) {
    console.error("Failed to reset rate limit bucket", error);
  }
}

export function getClientIp(req: Request): string {
  // Prefer the header a trusted reverse proxy overwrites. X-Forwarded-For is
  // client-controlled unless a proxy appends to it, so it is only a fallback.
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
