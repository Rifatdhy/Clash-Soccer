import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  badRequest,
  isNonEmptyString,
  notFound,
  requireAdmin,
  serverError,
} from "@/lib/api-helpers";

function mapFaq(row: any) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
  };
}

async function getFaqs() {
  const res = await query("SELECT * FROM faqs ORDER BY display_order ASC, created_at ASC");
  return res.rows.map(mapFaq);
}

export async function GET() {
  try {
    return NextResponse.json(await getFaqs());
  } catch (error) {
    return serverError(error, "Failed to fetch FAQs");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, question, answer } = body;

    if (!isNonEmptyString(id) || !isNonEmptyString(question) || !isNonEmptyString(answer)) {
      return badRequest("Missing required fields");
    }

    const orderRes = await query("SELECT COALESCE(MAX(display_order), 0) as max_order FROM faqs");
    const nextOrder = orderRes.rows[0].max_order + 1;

    await query(
      `INSERT INTO faqs (id, question, answer, display_order)
       VALUES ($1, $2, $3, $4)`,
      [id.trim(), question.trim(), answer.trim(), nextOrder]
    );

    return NextResponse.json(await getFaqs());
  } catch (error) {
    return serverError(error, "Failed to create FAQ");
  }
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, question, answer } = body;

    if (!isNonEmptyString(id)) {
      return badRequest("FAQ ID is required");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (question !== undefined) {
      if (!isNonEmptyString(question)) return badRequest("Invalid question");
      fields.push(`question = $${idx++}`);
      values.push(question.trim());
    }
    if (answer !== undefined) {
      if (!isNonEmptyString(answer)) return badRequest("Invalid answer");
      fields.push(`answer = $${idx++}`);
      values.push(answer.trim());
    }

    if (fields.length > 0) {
      values.push(id.trim());
      const updated = await query(
        `UPDATE faqs SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );

      if (updated.rowCount === 0) return notFound("FAQ not found");
    }

    return NextResponse.json(await getFaqs());
  } catch (error) {
    return serverError(error, "Failed to update FAQ");
  }
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!isNonEmptyString(id)) {
      return badRequest("FAQ ID is required");
    }

    const deleted = await query("DELETE FROM faqs WHERE id = $1", [id.trim()]);
    if (deleted.rowCount === 0) return notFound("FAQ not found");

    return NextResponse.json(await getFaqs());
  } catch (error) {
    return serverError(error, "Failed to delete FAQ");
  }
}