import { query } from "./db.ts";
import { createLogger } from "./logger.ts";
import {
  createMemoryStore,
  createPostgresStore,
  type RateLimitOptions,
  type RateLimitStore,
} from "./rate-limit-store.ts";

export type { RateLimitOptions } from "./rate-limit-store.ts";

const logger = createLogger({ service: "rate-limit" });

export const RATE_LIMIT_DEFAULTS: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 5,
};

export const RSVP_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 20,
};

/**
 * Per-process ceiling for all login attempts. `X-Real-IP` is client-controlled
 * unless a proxy overwrites it, so a per-IP bucket alone can be bypassed by
 * rotating the header. This second bucket makes a brute-force run expensive
 * even when every request claims a different address.
 */
export const LOGIN_GLOBAL_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 60,
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
    logger.error("Rate limit store unavailable; using the in-memory fallback", {
      error,
    });
    return fallbackStore.consume(bucketKey, options);
  }
}

export async function resetRateLimit(scope: string, key: string) {
  const bucketKey = `${scope}:${key}`;

  try {
    await getStore().reset(bucketKey);
  } catch (error) {
    logger.error("Failed to reset a rate limit bucket", { error });
  }
}

/**
 * Check both the caller's own bucket and the site-wide login ceiling. A
 * successful login resets only the caller's bucket; the global bucket is
 * deliberately left alone so an attacker cannot reset it by logging in.
 */
export async function consumeLoginAttempt(
  ip: string
): Promise<{ allowed: boolean; retryAfterMs: number; scope: "ip" | "global" }> {
  const perIp = await consume("login", ip, RATE_LIMIT_DEFAULTS);
  if (!perIp.allowed) {
    return { ...perIp, scope: "ip" };
  }

  const global = await consume("login-global", "all", LOGIN_GLOBAL_RATE_LIMIT);
  if (!global.allowed) {
    return { ...global, scope: "global" };
  }

  return { allowed: true, retryAfterMs: 0, scope: "ip" };
}

export async function resetLoginIpBucket(ip: string) {
  await resetRateLimit("login", ip);
}

export function getClientIp(req: Request): string {
  // Prefer the header a trusted reverse proxy overwrites. X-Forwarded-For is
  // client-controlled unless a proxy appends to it, so it is only a fallback.
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  warnMissingClientIp();
  return UNKNOWN_CLIENT_IP;
}

let warnedMissingClientIp = false;

/**
 * Every request without an address shares one bucket, so a burst of failures
 * locks out every user. That is a deployment problem (the proxy is not setting
 * `X-Real-IP`), and the only way an operator finds out is if it is said once,
 * loudly, in the log.
 */
function warnMissingClientIp(): void {
  if (warnedMissingClientIp) return;
  warnedMissingClientIp = true;
  logger.warn(
    "No client IP header found; all rate limited requests share one bucket. Set X-Real-IP at the proxy."
  );
}

/**
 * Bucket used when no proxy header identifies the caller.
 *
 * Without an address every client shares one bucket, so a burst of failures
 * locks everyone out. That is still the right failure mode — a per-request
 * bucket would silently disable the limit entirely — but it means a deployment
 * behind a proxy must set `X-Real-IP`. `getClientIp` warns once in the log when
 * that is missing.
 */
export const UNKNOWN_CLIENT_IP = "unknown";
