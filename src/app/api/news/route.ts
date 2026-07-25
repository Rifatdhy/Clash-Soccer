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

// Helper to convert DB keys to frontend camelCase
function mapNews(row: any) {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const res = await query("SELECT * FROM news WHERE slug = $1", [slug]);
      if (res.rowCount === 0) {
        return NextResponse.json([], { status: 200 });
      }
      return NextResponse.json([mapNews(res.rows[0])]);
    }

    const res = await query("SELECT * FROM news ORDER BY date DESC");
    return NextResponse.json(res.rows.map(mapNews));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, title, slug, content, excerpt, coverImage, date } = body;

    if (!isNonEmptyString(id) || !isNonEmptyString(title) || !isNonEmptyString(slug) || !isNonEmptyString(content) || !isValidDateString(date)) {
      return badRequest("Invalid news data");
    }

    await query(
      `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id.trim(), title.trim(), slug.trim(), content.trim(), isNonEmptyString(excerpt) ? excerpt.trim() : "", isNonEmptyString(coverImage) ? coverImage.trim() : "", date]
    );

    const res = await query("SELECT * FROM news ORDER BY date DESC");
    return NextResponse.json(res.rows.map(mapNews));
  } catch (error) {
    return serverError(error, "Failed to create news");
  }
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!isNonEmptyString(id)) {
      return badRequest("News ID is required");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.title !== undefined) {
      if (!isNonEmptyString(updates.title)) return badRequest("Invalid title");
      fields.push(`title = $${idx++}`);
      values.push(updates.title.trim());
    }
    if (updates.slug !== undefined) {
      if (!isNonEmptyString(updates.slug)) return badRequest("Invalid slug");
      fields.push(`slug = $${idx++}`);
      values.push(updates.slug.trim());
    }
    if (updates.content !== undefined) {
      if (!isNonEmptyString(updates.content)) return badRequest("Invalid content");
      fields.push(`content = $${idx++}`);
      values.push(updates.content.trim());
    }
    if (updates.excerpt !== undefined) {
      fields.push(`excerpt = $${idx++}`);
      values.push(isNonEmptyString(updates.excerpt) ? updates.excerpt.trim() : "");
    }
    if (updates.coverImage !== undefined) {
      fields.push(`cover_image = $${idx++}`);
      values.push(isNonEmptyString(updates.coverImage) ? updates.coverImage.trim() : "");
    }
    if (updates.date !== undefined) {
      if (!isValidDateString(updates.date)) return badRequest("Invalid date");
      fields.push(`date = $${idx++}`);
      values.push(updates.date);
    }

    if (fields.length > 0) {
      values.push(id.trim());
      const updated = await query(
        `UPDATE news SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );
      if (updated.rowCount === 0) return notFound("News not found");
    }

    const res = await query("SELECT * FROM news ORDER BY date DESC");
    return NextResponse.json(res.rows.map(mapNews));
  } catch (error) {
    return serverError(error, "Failed to update news");
  }
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!isNonEmptyString(id)) {
      return badRequest("News ID is required");
    }

    const deleted = await query("DELETE FROM news WHERE id = $1", [id.trim()]);
    if (deleted.rowCount === 0) return notFound("News not found");

    const res = await query("SELECT * FROM news ORDER BY date DESC");
    return NextResponse.json(res.rows.map(mapNews));
  } catch (error) {
    return serverError(error, "Failed to delete news");
  }
}
