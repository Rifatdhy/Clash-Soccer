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

const faqSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  question: z.string().trim(),
  answer: z.string().trim(),
});

const faqUpdateSchema = faqSchema.partial().extend({
  id: z.string().trim().min(1, "ID is required"),
});

// --- Database Service Functions ---

async function getFaqs() {
  const res = await query("SELECT id, question, answer FROM faqs ORDER BY display_order ASC, created_at ASC");
  return res.rows;
}

async function createFaq(data: z.infer<typeof faqSchema>) {
  const { id, question, answer } = data;
  const orderRes = await query<{ max_order: number }>("SELECT COALESCE(MAX(display_order), 0) as max_order FROM faqs");
  const nextOrder = orderRes.rows[0].max_order + 1;

  await query(
    `INSERT INTO faqs (id, question, answer, display_order)
     VALUES ($1, $2, $3, $4)`,
    [id, question, answer, nextOrder]
  );
  return getFaqs();
}

async function updateFaq(data: z.infer<typeof faqUpdateSchema>) {
  const { id, ...fieldsToUpdate } = data;
  
  const allowedKeys = ["question", "answer"];
  const filteredFields = Object.keys(fieldsToUpdate).filter((key) => allowedKeys.includes(key));

  if (filteredFields.length === 0) {
    return getFaqs(); // Nothing to update
  }

  const fields = filteredFields.map((key, i) => `${key} = $${i + 1}`);
  const fieldsToUpdateMap = fieldsToUpdate as Record<string, string>;
  const values = filteredFields.map((key) => fieldsToUpdateMap[key]);
  values.push(id);

  const res = await query(
    `UPDATE faqs SET ${fields.join(", ")} WHERE id = $${values.length}`,
    values
  );

  if (res.rowCount === 0) {
    throw new Error("NOT_FOUND");
  }
  return getFaqs();
}

async function deleteFaq(id: string) {
  const res = await query("DELETE FROM faqs WHERE id = $1", [id]);
  if (res.rowCount === 0) {
    throw new Error("NOT_FOUND");
  }
  return getFaqs();
}


// --- API Route Handlers ---

export async function GET() {
  try {
    const faqs = await getFaqs();
    return success(faqs);
  } catch (e) {
    return serverError(e, "Failed to fetch FAQs");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, faqSchema, async (data) => {
    try {
      const updatedFaqs = await createFaq(data);
      return created(updatedFaqs);
    } catch (e) {
      return serverError(e, "Failed to create FAQ");
    }
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, faqUpdateSchema, async (data) => {
    try {
      const updatedFaqs = await updateFaq(data);
      return success(updatedFaqs);
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") {
        return notFound("FAQ not found");
      }
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
    const updatedFaqs = await deleteFaq(id);
    return success(updatedFaqs);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return notFound("FAQ not found");
    }
    return serverError(e, "Failed to delete FAQ");
  }
}