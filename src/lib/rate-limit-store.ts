export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export interface RateLimitStore {
  consume(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

export interface RateLimitRow {
  count: number;
  reset_at: Date | string;
}

export type RateLimitQuery = (
  text: string,
  params?: unknown[]
) => Promise<{ rows: RateLimitRow[] }>;

const MAX_BUCKETS = 5000;

export function createMemoryStore(): RateLimitStore {
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

  return {
    async consume(key, options) {
      const now = Date.now();
      prune(now);

      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true, retryAfterMs: 0 };
      }

      bucket.count += 1;
      if (bucket.count > options.max) {
        return { allowed: false, retryAfterMs: bucket.resetAt - now };
      }

      return { allowed: true, retryAfterMs: 0 };
    },

    async reset(key) {
      buckets.delete(key);
    },
  };
}

const CONSUME_SQL = `
  INSERT INTO rate_limits (key, count, reset_at)
  VALUES ($1, 1, now() + make_interval(secs => $2::double precision / 1000))
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
    reset_at = CASE WHEN rate_limits.reset_at <= now()
                    THEN now() + make_interval(secs => $2::double precision / 1000)
                    ELSE rate_limits.reset_at END
  RETURNING count, reset_at
`;

export function createPostgresStore(query: RateLimitQuery): RateLimitStore {
  return {
    async consume(key, options) {
      const result = await query(CONSUME_SQL, [key, options.windowMs]);
      const row = result.rows[0];
      if (!row) return { allowed: false, retryAfterMs: options.windowMs };

      const resetAt = row.reset_at instanceof Date ? row.reset_at : new Date(row.reset_at);
      return {
        allowed: row.count <= options.max,
        retryAfterMs: Math.max(0, resetAt.getTime() - Date.now()),
      };
    },

    async reset(key) {
      await query("DELETE FROM rate_limits WHERE key = $1", [key]);
    },
  };
}
