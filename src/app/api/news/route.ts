import {
  badRequest,
  created,
  notFound,
  requireAdmin,
  serverError,
  success,
  validate,
} from "@/lib/api-helpers";
import { query } from "@/lib/db";
import { z } from "zod";

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
  excerpt: z.string().trim().optional(),
  coverImage: z.string().trim().url("Invalid URL format").optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
});

const newsSchema = baseNewsSchema;
const newsUpdateSchema = baseNewsSchema.partial().required({ id: true });

const deleteNewsSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
});


import { NewsItem } from "@/types";

// --- Database Service Functions ---

interface NewsRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string;
  date: string;
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

async function getNews(slug?: string | null) {
  if (slug) {
    const res = await query<NewsRow>("SELECT * FROM news WHERE slug = $1", [slug]);
    return res.rows.map(mapNews);
  }
  const res = await query<NewsRow>("SELECT * FROM news ORDER BY date DESC");
  return res.rows.map(mapNews);
}

// --- API Route Handlers ---

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const news = await getNews(slug);
    return success(slug && news.length === 0 ? [] : news);
  } catch (e) {
    return serverError(e, "Failed to fetch news");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, newsSchema, async (data) => {
    const { id, title, slug, content, excerpt, coverImage, date } = data;
    try {
      await query(
        `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, title, slug, content, excerpt || null, coverImage || null, date]
      );
      const allNews = await getNews();
      return created(allNews);
    } catch (e) {
      return serverError(e, "Failed to create news item");
    }
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, newsUpdateSchema, async (data) => {
    const { id, ...updates } = data;
    try {
      const fields: string[] = [];
      const values: (string | number | boolean)[] = [];
      let idx = 1;

      const fieldMapping: Record<string, string> = {
        title: "title",
        slug: "slug",
        content: "content",
        excerpt: "excerpt",
        coverImage: "cover_image",
        date: "date",
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
        `UPDATE news SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );

      if (res.rowCount === 0) {
        return notFound("News item not found");
      }

      const updatedNews = await getNews();
      return success(updatedNews);
    } catch (e) {
      return serverError(e, "Failed to update news item");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const validation = deleteNewsSchema.safeParse({ id });
  if (!validation.success) {
    return badRequest("News ID is required");
  }

  try {
    const res = await query("DELETE FROM news WHERE id = $1", [validation.data.id]);
    if (res.rowCount === 0) {
      return notFound("News item not found");
    }
    const updatedNews = await getNews();
    return success(updatedNews);
  } catch (e) {
    return serverError(e, "Failed to delete news item");
  }
}
