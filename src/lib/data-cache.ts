/**
 * Process-wide short-lived cache for server reads.
 *
 * The cache used to be a module-level `Map` in `data.ts`. Route handlers and
 * pages are separate module graphs in Next.js, so a write from `/api/settings`
 * cleared a copy that the page renderer never read: an admin edit could take
 * up to the full TTL to appear. Keeping the store on `globalThis` gives every
 * bundle in the process the same Map, so invalidation actually invalidates.
 */

export const CACHE_STORE_KEY = "__clashSoccerDataCache";

/**
 * Above this many entries, `writeCache` sweeps the store.
 *
 * Without it the store only drops an entry when that exact key is read again,
 * and public `/news/<slug>` and `/gallery/<id>` routes let anyone mint new
 * keys: an entry from a slug nobody revisits would live for the process
 * lifetime.
 *
 * Sweeping expired keys alone is not enough. A crawler can write entries that
 * are still valid for their whole 30s ttl, so the store would keep growing
 * while nothing is expired. Past the threshold the store is therefore also
 * trimmed to the newest `CACHE_MAX_ENTRIES`, oldest first.
 */
export const CACHE_PRUNE_THRESHOLD = 500;

/** Hard ceiling kept after a prune, so a burst of live keys stays bounded. */
export const CACHE_MAX_ENTRIES = 400;

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

type CacheStore = Map<string, CacheEntry>;

function store(): CacheStore {
  const holder = globalThis as Record<string, unknown>;
  const existing = holder[CACHE_STORE_KEY];
  if (existing instanceof Map) return existing as CacheStore;

  const created: CacheStore = new Map();
  holder[CACHE_STORE_KEY] = created;
  return created;
}

export function readCache(key: string): unknown {
  const hit = store().get(key);
  if (!hit) return undefined;
  if (hit.expiresAt <= Date.now()) {
    store().delete(key);
    return undefined;
  }
  return hit.value;
}

export function writeCache(key: string, value: unknown, ttlMs: number): void {
  const target = store();
  target.set(key, { expiresAt: Date.now() + ttlMs, value });

  // Checked after the set so the entry just written is counted; otherwise a
  // store sitting exactly at the threshold could accept one more write forever.
  if (target.size > CACHE_PRUNE_THRESHOLD) pruneCache();
}

/**
 * Drop expired entries, then trim to the newest `CACHE_MAX_ENTRIES`.
 *
 * Called automatically from `writeCache` past the threshold. Map preserves
 * insertion order, and an overwrite keeps the original position, so the oldest
 * keys are the ones evicted. That is the right choice: the key a reader asks
 * for next is far more likely to be one written recently.
 */
export function pruneCache(): void {
  const target = store();
  const now = Date.now();

  for (const [key, entry] of target) {
    if (entry.expiresAt <= now) target.delete(key);
  }

  if (target.size <= CACHE_MAX_ENTRIES) return;

  const excess = target.size - CACHE_MAX_ENTRIES;
  let dropped = 0;
  for (const key of target.keys()) {
    if (dropped >= excess) break;
    target.delete(key);
    dropped += 1;
  }
}

export function clearCache(): void {
  store().clear();
}
