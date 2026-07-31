const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now();

  if (attempts.size > 1000) {
    for (const [key, record] of attempts) {
      if (record.resetAt < now) attempts.delete(key);
    }
  }

  const record = attempts.get(ip);
  if (!record || record.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

export function clearRateLimit(ip: string) {
  attempts.delete(ip);
}
