import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper to convert DB keys to frontend camelCase
function mapAlbum(row: any, items: any[] = []) {
  return {
    id: row.id,
    title: row.title,
    matchDate: row.match_date,
    coverUrl: row.cover_url,
    gdriveLink: row.gdrive_link || undefined,
    items: items.map(i => ({
      id: i.id,
      type: i.type,
      url: i.url,
      thumbnailUrl: i.thumbnail_url || undefined,
    })),
  };
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

    const albumsRes = await query("SELECT * FROM albums ORDER BY match_date DESC");
    const albums = [];
    for (const album of albumsRes.rows) {
      const itemsRes = await query("SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC", [album.id]);
      albums.push(mapAlbum(album, itemsRes.rows));
    }

    return NextResponse.json(albums);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, title, matchDate, coverUrl, gdriveLink, items } = body;

    if (!id || !title || !matchDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await query("BEGIN");

    await query(
      `INSERT INTO albums (id, title, match_date, cover_url, gdrive_link)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, title, matchDate, coverUrl || "", gdriveLink || null]
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query(
          `INSERT INTO album_items (id, album_id, type, url, thumbnail_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.id, id, item.type || "image", item.url, item.thumbnailUrl || null]
        );
      }
    }

    await query("COMMIT");

    // Return all albums after creation
    const albumsRes = await query("SELECT * FROM albums ORDER BY match_date DESC");
    const albums = [];
    for (const album of albumsRes.rows) {
      const itemsRes = await query("SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC", [album.id]);
      albums.push(mapAlbum(album, itemsRes.rows));
    }

    return NextResponse.json(albums);
  } catch (error: any) {
    await query("ROLLBACK");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.matchDate !== undefined) {
      fields.push(`match_date = $${idx++}`);
      values.push(updates.matchDate);
    }
    if (updates.coverUrl !== undefined) {
      fields.push(`cover_url = $${idx++}`);
      values.push(updates.coverUrl);
    }
    if (updates.gdriveLink !== undefined) {
      fields.push(`gdrive_link = $${idx++}`);
      values.push(updates.gdriveLink || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await query(
        `UPDATE albums SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );
    }

    // Return all albums after update
    const albumsRes = await query("SELECT * FROM albums ORDER BY match_date DESC");
    const albums = [];
    for (const album of albumsRes.rows) {
      const itemsRes = await query("SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC", [album.id]);
      albums.push(mapAlbum(album, itemsRes.rows));
    }

    return NextResponse.json(albums);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    await query("DELETE FROM albums WHERE id = $1", [id]);

    // Return all albums after deletion
    const albumsRes = await query("SELECT * FROM albums ORDER BY match_date DESC");
    const albums = [];
    for (const album of albumsRes.rows) {
      const itemsRes = await query("SELECT * FROM album_items WHERE album_id = $1 ORDER BY created_at ASC", [album.id]);
      albums.push(mapAlbum(album, itemsRes.rows));
    }

    return NextResponse.json(albums);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
