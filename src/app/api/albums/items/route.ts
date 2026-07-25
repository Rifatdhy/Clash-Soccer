import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  badRequest,
  isNonEmptyString,
  notFound,
  requireAdmin,
  serverError,
} from "@/lib/api-helpers";

const ALBUM_ITEM_TYPES = ["image", "video"] as const;

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { albumId, id, type, url, thumbnailUrl } = body;
    const safeType = type || "image";

    if (!isNonEmptyString(albumId) || !isNonEmptyString(id) || !isNonEmptyString(url)) {
      return badRequest("Missing required fields");
    }

    if (!ALBUM_ITEM_TYPES.includes(safeType)) {
      return badRequest("Invalid album item type");
    }

    const albumRes = await query("SELECT id FROM albums WHERE id = $1", [albumId.trim()]);
    if (albumRes.rowCount === 0) return notFound("Album not found");

    await query(
      `INSERT INTO album_items (id, album_id, type, url, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id.trim(),
        albumId.trim(),
        safeType,
        url.trim(),
        isNonEmptyString(thumbnailUrl) ? thumbnailUrl.trim() : null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error, "Failed to add album item");
  }
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!isNonEmptyString(id)) {
      return badRequest("Item ID is required");
    }

    const deleted = await query("DELETE FROM album_items WHERE id = $1", [id.trim()]);
    if (deleted.rowCount === 0) return notFound("Album item not found");

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error, "Failed to delete album item");
  }
}