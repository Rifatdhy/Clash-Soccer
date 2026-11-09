import { z } from "zod";
import { query } from "@/lib/db";
import { fetchNews, fetchNewsBySlug, invalidateDataCache } from "@/lib/data";
import { buildUpdate } from "@/lib/sql";
import { isUniqueViolation } from "@/lib/pg-errors";
import { isAllowedImageUrl } from "@/lib/validation";
import {
  releaseUploadsFor,
  releaseReplacedUploads,
} from "@/lib/storage-cleanup-server";
import {
  badRequest,
  conflict,
  created,
  notFound,
  requireAdmin,
  serverError,
  success,
  validate,
} from "@/lib/api-helpers";

// --- Zod Schemas for Validation ---

const baseNewsSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be a valid URL slug"),
  content: z.string().trim().min(1, "Content is required"),
  excerpt: z.string().trim().optional().or(z.literal("")),
  coverImage: z
    .string()
    .trim()
    .refine(isAllowedImageUrl, "Invalid image URL")
    .optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
});

const newsSchema = baseNewsSchema;
const newsUpdateSchema = baseNewsSchema.partial().required({ id: true });

const deleteNewsSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
});

const fieldMapping: Record<string, string> = {
  title: "title",
  slug: "slug",
  content: "content",
  excerpt: "excerpt",
  coverImage: "cover_image",
  date: "date",
};

// --- API Route Handlers ---

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const item = await fetchNewsBySlug(slug);
      return success(item ? [item] : []);
    }

    return success(await fetchNews());
  } catch (e) {
    return serverError(e, "Failed to fetch news");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  return validate(req, newsSchema, async (data) => {
    const { id, title, slug, content, excerpt, coverImage, date } = data;
    try {
      await query(
        `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, title, slug, content, excerpt || "", coverImage || "", date]
      );

      invalidateDataCache();
      return created(await fetchNews());
    } catch (e) {
      if (isUniqueViolation(e)) {
        return conflict("A news item with this slug already exists");
      }
      return serverError(e, "Failed to create news item");
    }
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  return validate(req, newsUpdateSchema, async (data) => {
    const { id, ...updates } = data;
    const plan = buildUpdate("news", "id", id, fieldMapping, updates);
    if (!plan) {
      return badRequest("No fields to update");
    }

    try {
      // Read the old cover before the update so a replaced image can be
      // cleaned up afterwards.
      const previous = await query<{ cover_image: string | null }>(
        "SELECT cover_image FROM news WHERE id = $1",
        [id]
      );

      const res = await query(plan.text, plan.values);
      if (res.rowCount === 0) {
        return notFound("News item not found");
      }

      invalidateDataCache();
      // Only a cover the request actually set can replace the old one; a
      // partial update that leaves the field alone must not touch the file.
      await releaseReplacedUploads(
        [previous.rows[0]?.cover_image],
        ["coverImage" in updates ? updates.coverImage : previous.rows[0]?.cover_image]
      );
      return success(await fetchNews());
    } catch (e) {
      if (isUniqueViolation(e)) {
        return conflict("A news item with this slug already exists");
      }
      return serverError(e, "Failed to update news item");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const validation = deleteNewsSchema.safeParse({ id });
  if (!validation.success) {
    return badRequest("News ID is required");
  }

  try {
    // Read the image URLs before the row disappears: afterwards there is
    // nothing left to tell us which uploads belonged to this item.
    const deleted = await query<{ cover_image: string | null }>(
      "DELETE FROM news WHERE id = $1 RETURNING cover_image",
      [validation.data.id]
    );
    if (deleted.rowCount === 0) {
      return notFound("News item not found");
    }

    invalidateDataCache();
    await releaseUploadsFor([deleted.rows[0].cover_image]);
    return success(await fetchNews());
  } catch (e) {
    return serverError(e, "Failed to delete news item");
  }
}
