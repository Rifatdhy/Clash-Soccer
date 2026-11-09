import { randomUUID } from "crypto";
import { z } from "zod";
import { query } from "@/lib/db";
import { fetchAlbum, invalidateDataCache } from "@/lib/data";
import { isAllowedImageUrl, isHttpUrl } from "@/lib/validation";
import { releaseUploadsFor } from "@/lib/storage-cleanup-server";
import {
  badRequest,
  created,
  notFound,
  requireAdmin,
  serverError,
  success,
  validate,
} from "@/lib/api-helpers";

// --- Zod Schemas ---

const albumItemSchema = z
  .object({
    albumId: z.string().trim().min(1, "Album ID is required"),
    type: z.enum(["image", "video"]).default("image"),
    url: z.string().trim().min(1, "URL is required"),
    thumbnailUrl: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((item, ctx) => {
    const valid =
      item.type === "image" ? isAllowedImageUrl(item.url) : isHttpUrl(item.url);
    if (!valid) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message:
          item.type === "image"
            ? "Image must be uploaded or hosted on an allowed host"
            : "Video must be an http(s) URL",
      });
    }
    if (item.thumbnailUrl && !isAllowedImageUrl(item.thumbnailUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["thumbnailUrl"],
        message: "Invalid thumbnail URL",
      });
    }
  });

const deleteItemSchema = z.object({
  id: z.string().trim().min(1, "Item ID is required"),
});

// --- Route Handlers ---

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, albumItemSchema, async (data) => {
    const { albumId, type, url, thumbnailUrl } = data;

    try {
      const albumRes = await query("SELECT id FROM albums WHERE id = $1", [albumId]);
      if (albumRes.rowCount === 0) {
        return notFound("Album not found");
      }

      await query(
        `INSERT INTO album_items (id, album_id, type, url, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), albumId, type, url, thumbnailUrl || null]
      );

      invalidateDataCache();
      const album = await fetchAlbum(albumId);
      if (!album) return notFound("Album not found");
      return created(album);
    } catch (e) {
      return serverError(e, "Failed to add album item");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const validation = deleteItemSchema.safeParse({ id });
  if (!validation.success) {
    return badRequest("Item ID is required");
  }

  try {
    const itemRes = await query<{
      album_id: string;
      url: string | null;
      thumbnail_url: string | null;
    }>(
      "DELETE FROM album_items WHERE id = $1 RETURNING album_id, url, thumbnail_url",
      [validation.data.id]
    );
    if (itemRes.rowCount === 0) {
      return notFound("Album item not found");
    }

    invalidateDataCache();
    await releaseUploadsFor([itemRes.rows[0].url, itemRes.rows[0].thumbnail_url]);

    const album = await fetchAlbum(itemRes.rows[0].album_id);
    if (!album) return notFound("Album not found");
    return success(album);
  } catch (e) {
    return serverError(e, "Failed to delete album item");
  }
}
