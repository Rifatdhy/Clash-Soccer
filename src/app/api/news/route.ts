import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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
  try {
    const body = await req.json();
    const { id, title, slug, content, excerpt, coverImage, date } = body;

    if (!id || !title || !slug || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await query(
      `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, title, slug, content, excerpt || "", coverImage || "", date]
    );

    const res = await query("SELECT * FROM news ORDER BY date DESC");
    return NextResponse.json(res.rows.map(mapNews));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "News ID is required" }, { status: 400 });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.slug !== undefined) {
      fields.push(`slug = $${idx++}`);
      values.push(updates.slug);
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${idx++}`);
      values.push(updates.content);
    }
    if (updates.excerpt !== undefined) {
      fields.push(`excerpt = $${idx++}`);
      values.push(updates.excerpt);
    }
    if (updates.coverImage !== undefined) {
      fields.push(`cover_image = $${idx++}`);
      values.push(updates.coverImage);
    }
    if (updates.date !== undefined) {
      fields.push(`date = $${idx++}`);
      values.push(updates.date);
    }

    if (fields.length > 0) {
      values.push(id);
      await query(
        `UPDATE news SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );
    }

    const res = await query("SELECT * FROM news ORDER BY date DESC");
    return NextResponse.json(res.rows.map(mapNews));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "News ID is required" }, { status: 400 });
    }

    await query("DELETE FROM news WHERE id = $1", [id]);

    const res = await query("SELECT * FROM news ORDER BY date DESC");
    return NextResponse.json(res.rows.map(mapNews));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}