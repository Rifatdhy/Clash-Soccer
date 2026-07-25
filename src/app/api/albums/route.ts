import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  badRequest,
  isNonEmptyString,
  isValidDateString,
  notFound,
  requireAdmin,
  serverError,
} from "@/lib/api-helpers";

const ALBUM_ITEM_TYPES = ["image", "video"] as const;

function mapAlbum(row: any, items: any[] = []) {
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

async function getAlbums() {
  const albumsRes = await query("SELECT * FROM albums ORDER BY match_date DESC");
  const albums = [];

  for (const album of albumsRes.rows) {
    const itemsRes = await query("SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC", [album.id]);
    albums.push(mapAlbum(album, itemsRes.rows));
  }

  return albums;
}

function validateAlbumItems(items: unknown) {
  if (items === undefined) return null;
  if (!Array.isArray(items)) return "Items must be an array";

  for (const item of items) {
    if (!isNonEmptyString(item?.id) || !isNonEmptyString(item?.url)) {
      return "Invalid album item";
    }

    if (item.type !== undefined && !ALBUM_ITEM_TYPES.includes(item.type)) {
      return "Invalid album item type";
    }
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const albumRes = await query("SELECT * FROM albums WHERE id = $1", [id]);
      if (albumRes.rowCount === 0) {
        return NextResponse.json([], { status: 200 });
      }
      const itemsRes = await query("SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC", [id]);
      return NextResponse.json([mapAlbum(albumRes.rows[0], itemsRes.rows)]);
    }

    return NextResponse.json(await getAlbums());
  } catch (error) {
    return serverError(error, "Failed to fetch albums");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, title, matchDate, coverUrl, gdriveLink, items } = body;

    if (!isNonEmptyString(id) || !isNonEmptyString(title) || !isValidDateString(matchDate)) {
      return badRequest("Invalid album data");
    }

    const itemError = validateAlbumItems(items);
    if (itemError) return badRequest(itemError);

    await query("BEGIN");

    await query(
      `INSERT INTO albums (id, title, match_date, cover_url, gdrive_link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id.trim(),
        title.trim(),
        matchDate,
        isNonEmptyString(coverUrl) ? coverUrl.trim() : "",
        isNonEmptyString(gdriveLink) ? gdriveLink.trim() : null,
      ]
    );

    if (Array.isArray(items)) {
      for (const item of items) {
        await query(
          `INSERT INTO album_items (id, album_id, type, url, thumbnail_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            item.id.trim(),
            id.trim(),
            item.type || "image",
            item.url.trim(),
            isNonEmptyString(item.thumbnailUrl) ? item.thumbnailUrl.trim() : null,
          ]
        );
      }
    }

    await query("COMMIT");
    return NextResponse.json(await getAlbums());
  } catch (error) {
    await query("ROLLBACK");
    return serverError(error, "Failed to create album");
  }
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!isNonEmptyString(id)) {
      return badRequest("Album ID is required");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.title !== undefined) {
      if (!isNonEmptyString(updates.title)) return badRequest("Invalid title");
      fields.push(`title = $${idx++}`);
      values.push(updates.title.trim());
    }
    if (updates.matchDate !== undefined) {
      if (!isValidDateString(updates.matchDate)) return badRequest("Invalid match date");
      fields.push(`match_date = $${idx++}`);
      values.push(updates.matchDate);
    }
    if (updates.coverUrl !== undefined) {
      fields.push(`cover_url = $${idx++}`);
      values.push(isNonEmptyString(updates.coverUrl) ? updates.coverUrl.trim() : "");
    }
    if (updates.gdriveLink !== undefined) {
      fields.push(`gdrive_link = $${idx++}`);
      values.push(isNonEmptyString(updates.gdriveLink) ? updates.gdriveLink.trim() : null);
    }

    if (fields.length > 0) {
      values.push(id.trim());
      const updated = await query(
        `UPDATE albums SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );

      if (updated.rowCount === 0) return notFound("Album not found");
    }

    return NextResponse.json(await getAlbums());
  } catch (error) {
    return serverError(error, "Failed to update album");
  }
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!isNonEmptyString(id)) {
      return badRequest("Album ID is required");
    }

    const deleted = await query("DELETE FROM albums WHERE id = $1", [id.trim()]);
    if (deleted.rowCount === 0) return notFound("Album not found");

    return NextResponse.json(await getAlbums());
  } catch (error) {
    return serverError(error, "Failed to delete album");
  }
}