/**
 * Server-side reads for public pages and API routes.
 *
 * Pages call these directly so content is rendered in the server HTML instead
 * of arriving after a client-side fetch. Results are cached in memory for a
 * short window; every write calls `invalidateDataCache` so admins see their
 * changes immediately.
 */

import { query } from "./db.ts";
import { clearCache, readCache, writeCache } from "./data-cache.ts";
import { groupAlbumItems } from "./albums.ts";
import { DEFAULT_SETTINGS } from "./defaults.ts";
import type {
  Album,
  AlbumItemRow,
  AlbumRow,
  FaqItem,
  FaqRow,
  Match,
  MatchRow,
  NewsItem,
  NewsRow,
  Setting,
  SettingRow,
} from "@/types";

const CACHE_TTL_MS = 30_000;

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = readCache(key);
  if (hit !== undefined) return hit as T;

  const value = await load();
  writeCache(key, value, CACHE_TTL_MS);
  return value;
}

/** Call after every successful write so public pages refetch. */
export function invalidateDataCache(): void {
  clearCache();
}

// --- Mappers ---

function mapMatch(row: MatchRow): Match {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    location: row.location,
    slotsTotal: row.slots_total,
    slotsAvailable: row.slots_available,
    status: row.status as Match["status"],
  };
}

function mapNews(row: NewsRow): NewsItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    date: row.date,
  };
}

function mapAlbum(row: AlbumRow & { gdrive_link?: string | null }, items: AlbumItemRow[] = []): Album {
  return {
    id: row.id,
    title: row.title,
    matchDate: row.match_date,
    coverUrl: row.cover_url,
    gdriveLink: row.gdrive_link || undefined,
    items: items.map((item) => ({
      id: item.id,
      type: item.type as "image" | "video",
      url: item.url,
      thumbnailUrl: item.thumbnail_url || undefined,
    })),
  };
}

function mapSettings(row: SettingRow): Setting {
  return {
    id: row.id,
    communityName: row.community_name,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    location: row.location,
    googleMapsEmbed: row.google_maps_embed,
  };
}

// --- Reads ---

export function fetchMatches(): Promise<Match[]> {
  return cached("matches", async () => {
    const res = await query<MatchRow>("SELECT * FROM matches ORDER BY date DESC, time DESC");
    return res.rows.map(mapMatch);
  });
}

export function fetchMatch(id: string): Promise<Match | null> {
  return cached(`match:${id}`, async () => {
    const res = await query<MatchRow>("SELECT * FROM matches WHERE id = $1", [id]);
    return res.rows[0] ? mapMatch(res.rows[0]) : null;
  });
}

export function fetchNews(): Promise<NewsItem[]> {
  return cached("news", async () => {
    const res = await query<NewsRow>("SELECT * FROM news ORDER BY date DESC");
    return res.rows.map(mapNews);
  });
}

export function fetchNewsBySlug(slug: string): Promise<NewsItem | null> {
  return cached(`news:${slug}`, async () => {
    const res = await query<NewsRow>("SELECT * FROM news WHERE slug = $1", [slug]);
    return res.rows[0] ? mapNews(res.rows[0]) : null;
  });
}

export function fetchAlbums(): Promise<Album[]> {
  return cached("albums", async () => {
    const albumsRes = await query<AlbumRow>("SELECT * FROM albums ORDER BY match_date DESC");
    if (albumsRes.rowCount === 0) return [];

    const ids = albumsRes.rows.map((album) => album.id);
    const itemsRes = await query<AlbumItemRow>(
      "SELECT * FROM album_items WHERE album_id = ANY($1::text[]) ORDER BY created_at ASC",
      [ids]
    );

    const grouped = groupAlbumItems(itemsRes.rows);
    return albumsRes.rows.map((album) => mapAlbum(album, grouped.get(album.id) ?? []));
  });
}

export function fetchAlbum(id: string): Promise<Album | null> {
  return cached(`album:${id}`, async () => {
    const albumRes = await query<AlbumRow>("SELECT * FROM albums WHERE id = $1", [id]);
    if (!albumRes.rows[0]) return null;

    const itemsRes = await query<AlbumItemRow>(
      "SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC",
      [id]
    );
    return mapAlbum(albumRes.rows[0], itemsRes.rows);
  });
}

export function fetchFaqs(): Promise<FaqItem[]> {
  return cached("faqs", async () => {
    const res = await query<FaqRow>(
      "SELECT id, question, answer FROM faqs ORDER BY display_order ASC, created_at ASC"
    );
    return res.rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
    }));
  });
}

export function fetchSettings(): Promise<Setting> {
  return cached("settings", async () => {
    const res = await query<SettingRow>("SELECT * FROM settings WHERE id = 'default'");
    return res.rows[0] ? mapSettings(res.rows[0]) : DEFAULT_SETTINGS;
  });
}
