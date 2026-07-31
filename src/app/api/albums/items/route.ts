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

// --- Zod Schemas ---

const albumItemSchema = z.object({
  albumId: z.string().trim().min(1, "Album ID is required"),
  id: z.string().trim().min(1, "Item ID is required"),
  type: z.enum(["image", "video"]).default("image"),
  url: z.string().trim().url("Invalid URL format"),
  thumbnailUrl: z.string().trim().url("Invalid URL format").optional().or(z.literal("")),
});

const deleteItemSchema = z.object({
  id: z.string().trim().min(1, "Item ID is required"),
});

// --- Route Handlers ---

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, albumItemSchema, async (data) => {
    const { albumId, id, type, url, thumbnailUrl } = data;
    try {
      const albumRes = await query("SELECT id FROM albums WHERE id = $1", [albumId]);
      if (albumRes.rowCount === 0) {
        return notFound("Album not found");
      }

      await query(
        `INSERT INTO album_items (id, album_id, type, url, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, albumId, type, url, thumbnailUrl || null]
      );

      return created({ ...data });
    } catch (e) {
      // Handle potential unique constraint violation for id
      if (e instanceof Error && e.message.includes("unique constraint")) {
        return badRequest("An item with this ID already exists.");
      }
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
    const res = await query("DELETE FROM album_items WHERE id = $1", [validation.data.id]);
    if (res.rowCount === 0) {
      return notFound("Album item not found");
    }
    return success({ message: "Album item deleted successfully" });
  } catch (e) {
    return serverError(e, "Failed to delete album item");
  }
}
