import { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { fetchFaqs, invalidateDataCache } from "@/lib/data";
import { buildUpdate } from "@/lib/sql";
import {
  badRequest,
  created,
  notFound,
  requireAdmin,
  serverError,
  success,
  validate,
} from "@/lib/api-helpers";

// --- Zod Schemas for Validation ---

const faqSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  question: z.string().trim(),
  answer: z.string().trim(),
});

const faqUpdateSchema = faqSchema.partial().extend({
  id: z.string().trim().min(1, "ID is required"),
});

const fieldMapping: Record<string, string> = {
  question: "question",
  answer: "answer",
};

// --- API Route Handlers ---

export async function GET() {
  try {
    return success(await fetchFaqs());
  } catch (e) {
    return serverError(e, "Failed to fetch FAQs");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, faqSchema, async (data) => {
    const { id, question, answer } = data;

    try {
      await withTransaction(async (client) => {
        // Read the last order and insert on the same connection.
        const orderRes = await client.query<{ max_order: number }>(
          "SELECT COALESCE(MAX(display_order), 0) as max_order FROM faqs"
        );
        await client.query(
          `INSERT INTO faqs (id, question, answer, display_order)
           VALUES ($1, $2, $3, $4)`,
          [id, question, answer, orderRes.rows[0].max_order + 1]
        );
      });

      invalidateDataCache();
      return created(await fetchFaqs());
    } catch (e) {
      return serverError(e, "Failed to create FAQ");
    }
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, faqUpdateSchema, async (data) => {
    const { id, ...updates } = data;
    const plan = buildUpdate("faqs", "id", id, fieldMapping, updates);
    if (!plan) {
      return success(await fetchFaqs());
    }

    try {
      const res = await query(plan.text, plan.values);
      if (res.rowCount === 0) {
        return notFound("FAQ not found");
      }

      invalidateDataCache();
      return success(await fetchFaqs());
    } catch (e) {
      return serverError(e, "Failed to update FAQ");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return badRequest("FAQ ID is required");
  }

  try {
    const res = await query("DELETE FROM faqs WHERE id = $1", [id]);
    if (res.rowCount === 0) {
      return notFound("FAQ not found");
    }

    invalidateDataCache();
    return success(await fetchFaqs());
  } catch (e) {
    return serverError(e, "Failed to delete FAQ");
  }
}
