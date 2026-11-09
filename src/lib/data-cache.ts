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
  store().set(key, { expiresAt: Date.now() + ttlMs, value });
}

export function clearCache(): void {
  store().clear();
}
