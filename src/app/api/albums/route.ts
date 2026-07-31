import { z } from "zod";
import { query } from "@/lib/db";
import {
  badRequest,
  created,
  notFound,
  requireAdmin,
  serverError,
  success,
  validate,
} from "@/lib/api-helpers";
import type { Album } from "@/types";

// --- Zod Schemas ---

const albumItemSchema = z.object({
  id: z.string().trim().min(1),
  type: z.enum(["image", "video"]).default("image"),
  url: z.string().trim().url(),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal("")),
});

const albumSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  matchDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  coverUrl: z.string().trim().url("Invalid URL format").or(z.literal("")),
  gdriveLink: z.string().trim().url("Invalid URL format").optional().or(z.literal("")),
  items: z.array(albumItemSchema).optional(),
});

const updateAlbumSchema = albumSchema.partial().required({ id: true });

// --- Types ---

interface AlbumRow {
  id: string;
  title: string;
  match_date: string;
  cover_url: string;
  gdrive_link?: string;
}

interface AlbumItemRow {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail_url?: string;
}

// --- Helper Functions ---

function mapAlbum(row: AlbumRow, items: AlbumItemRow[] = []): Album {
  return {
    id: row.id,
    title: row.title,
    matchDate: row.match_date,
    coverUrl: row.cover_url,
    gdriveLink: row.gdrive_link || undefined,
    items: items.map((i) => ({
      id: i.id,
      type: i.type,
      url: i.url,
      thumbnailUrl: i.thumbnail_url || undefined,
    })),
  };
}

async function getAlbums(id?: string) {
  if (id) {
    const albumRes = await query<AlbumRow>("SELECT * FROM albums WHERE id = $1", [id]);
    if (albumRes.rowCount === 0) {
      return [];
    }
    const itemsRes = await query<AlbumItemRow>(
      "SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC",
      [id]
    );
    return [mapAlbum(albumRes.rows[0], itemsRes.rows)];
  }

  const albumsRes = await query<AlbumRow>("SELECT * FROM albums ORDER BY match_date DESC");
  const albums = [];
  for (const album of albumsRes.rows) {
    const itemsRes = await query<AlbumItemRow>(
      "SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC",
      [album.id]
    );
    albums.push(mapAlbum(album, itemsRes.rows));
  }
  return albums;
}

// --- Route Handlers ---

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || undefined;
    const albums = await getAlbums(id);
    return success(albums);
  } catch (e) {
    return serverError(e, "Failed to fetch albums");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, albumSchema, async (data) => {
    const { id, title, matchDate, coverUrl, gdriveLink, items } = data;
    try {
      await query("BEGIN");

      await query(
        `INSERT INTO albums (id, title, match_date, cover_url, gdrive_link)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, title, matchDate, coverUrl, gdriveLink || null]
      );

      if (items) {
        for (const item of items) {
          await query(
            `INSERT INTO album_items (id, album_id, type, url, thumbnail_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [item.id, id, item.type, item.url, item.thumbnailUrl || null]
          );
        }
      }

      await query("COMMIT");
      const newAlbums = await getAlbums();
      return created(newAlbums);
    } catch (e) {
      await query("ROLLBACK");
      return serverError(e, "Failed to create album");
    }
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, updateAlbumSchema, async (data) => {
    const { id, ...updates } = data;
    try {
      const fields: string[] = [];
      const values: (string | number | boolean)[] = [];
      let idx = 1;

      const fieldMapping: Record<string, string> = {
        title: "title",
        matchDate: "match_date",
        coverUrl: "cover_url",
        gdriveLink: "gdrive_link",
      };

      const updateMap = updates as Record<string, string | number | boolean | undefined>;

      for (const key in updateMap) {
        if (Object.prototype.hasOwnProperty.call(updateMap, key) && fieldMapping[key]) {
          const value = updateMap[key];
          if (value !== undefined) {
            fields.push(`${fieldMapping[key]} = $${idx++}`);
            values.push(value);
          }
        }
      }

      if (fields.length === 0) {
        return badRequest("No fields to update");
      }

      values.push(id);
      const res = await query(
        `UPDATE albums SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );

      if (res.rowCount === 0) {
        return notFound("Album not found");
      }

      const updatedAlbums = await getAlbums();
      return success(updatedAlbums);
    } catch (e) {
      return serverError(e, "Failed to update album");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || typeof id !== "string") {
      return badRequest("Album ID is required");
    }

    const res = await query("DELETE FROM albums WHERE id = $1", [id]);
    if (res.rowCount === 0) {
      return notFound("Album not found");
    }

    const updatedAlbums = await getAlbums();
    return success(updatedAlbums);
  } catch (e) {
    return serverError(e, "Failed to delete album");
  }
}
