/**
 * `Retry-After` value for a rate-limited response, in seconds.
 *
 * The limiter already computes `retryAfterMs` but the routes discarded it, so
 * a well-behaved client had no idea how long to wait. Rounding up keeps a
 * client from retrying a moment too early and burning another attempt.
 */
export function retryAfterSeconds(retryAfterMs: number | null | undefined): string | null {
  if (retryAfterMs === null || retryAfterMs === undefined) return null;
  if (!Number.isFinite(retryAfterMs)) return null;
  if (retryAfterMs <= 0) return "1";
  return String(Math.ceil(retryAfterMs / 1000));
}
