/**
 * In-memory rate limiting. Kept bounded so spoofed identifiers cannot grow
 * memory without limit. For multi-instance deployments, put the counter in
 * a shared store instead.
 */

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export const RATE_LIMIT_DEFAULTS: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 5,
};

export const RSVP_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 20,
};

const MAX_BUCKETS = 5000;

const buckets = new Map<string, { count: number; resetAt: number }>();

function prune(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  while (buckets.size > MAX_BUCKETS) {
    const oldest = buckets.keys().next();
    if (oldest.done) break;
    buckets.delete(oldest.value);
  }
}

export function consume(
  scope: string,
  key: string,
  options: RateLimitOptions = RATE_LIMIT_DEFAULTS
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucketKey = `${scope}:${key}`;
  prune(now);

  const bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  bucket.count += 1;
  if (bucket.count > options.max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(scope: string, key: string) {
  buckets.delete(`${scope}:${key}`);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
