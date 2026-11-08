import { randomUUID } from "crypto";
import { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { fetchAlbum, fetchAlbums, invalidateDataCache } from "@/lib/data";
import { buildUpdate } from "@/lib/sql";
import { isAllowedImageUrl, isHttpUrl } from "@/lib/validation";
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
    id: z.string().trim().min(1).optional(),
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

const albumSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  matchDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  coverUrl: z.string().trim().refine(isAllowedImageUrl, "Invalid image URL"),
  gdriveLink: z
    .string()
    .trim()
    .refine((value) => value === "" || isHttpUrl(value), "Invalid URL format")
    .optional()
    .or(z.literal("")),
  items: z.array(albumItemSchema).optional(),
});

const updateAlbumSchema = albumSchema.partial().required({ id: true });

const fieldMapping: Record<string, string> = {
  title: "title",
  matchDate: "match_date",
  coverUrl: "cover_url",
  gdriveLink: "gdrive_link",
};

// --- Route Handlers ---

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || undefined;

    if (id) {
      const album = await fetchAlbum(id);
      return success(album ? [album] : []);
    }

    return success(await fetchAlbums());
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
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO albums (id, title, match_date, cover_url, gdrive_link)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, title, matchDate, coverUrl, gdriveLink || null]
        );

        for (const item of items ?? []) {
          await client.query(
            `INSERT INTO album_items (id, album_id, type, url, thumbnail_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              item.id ?? randomUUID(),
              id,
              item.type,
              item.url,
              item.thumbnailUrl || null,
            ]
          );
        }
      });

      invalidateDataCache();
      return created(await fetchAlbums());
    } catch (e) {
      return serverError(e, "Failed to create album");
    }
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, updateAlbumSchema, async (data) => {
    const { id, ...updates } = data;
    const plan = buildUpdate("albums", "id", id, fieldMapping, updates);
    if (!plan) {
      return badRequest("No fields to update");
    }

    try {
      const res = await query(plan.text, plan.values);
      if (res.rowCount === 0) {
        return notFound("Album not found");
      }

      invalidateDataCache();
      return success(await fetchAlbums());
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

    if (!id) {
      return badRequest("Album ID is required");
    }

    const res = await query("DELETE FROM albums WHERE id = $1", [id]);
    if (res.rowCount === 0) {
      return notFound("Album not found");
    }

    invalidateDataCache();
    return success(await fetchAlbums());
  } catch (e) {
    return serverError(e, "Failed to delete album");
  }
}
