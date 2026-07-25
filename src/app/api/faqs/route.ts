import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper to convert DB keys to frontend camelCase
function mapFaq(row: any) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
  };
}

export async function GET() {
  try {
    const res = await query("SELECT * FROM faqs ORDER BY display_order ASC, created_at ASC");
    return NextResponse.json(res.rows.map(mapFaq));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, question, answer } = body;

    if (!id || !question || !answer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get max order
    const orderRes = await query("SELECT COALESCE(MAX(display_order), 0) as max_order FROM faqs");
    const nextOrder = orderRes.rows[0].max_order + 1;

    await query(
      `INSERT INTO faqs (id, question, answer, display_order)
       VALUES ($1, $2, $3, $4)`,
      [id, question, answer, nextOrder]
    );

    const res = await query("SELECT * FROM faqs ORDER BY display_order ASC, created_at ASC");
    return NextResponse.json(res.rows.map(mapFaq));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, question, answer } = body;

    if (!id) {
      return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (question !== undefined) {
      fields.push(`question = $${idx++}`);
      values.push(question);
    }
    if (answer !== undefined) {
      fields.push(`answer = $${idx++}`);
      values.push(answer);
    }

    if (fields.length > 0) {
      values.push(id);
      await query(
        `UPDATE faqs SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );
    }

    const res = await query("SELECT * FROM faqs ORDER BY display_order ASC, created_at ASC");
    return NextResponse.json(res.rows.map(mapFaq));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 });
    }

    await query("DELETE FROM faqs WHERE id = $1", [id]);

    const res = await query("SELECT * FROM faqs ORDER BY display_order ASC, created_at ASC");
    return NextResponse.json(res.rows.map(mapFaq));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}