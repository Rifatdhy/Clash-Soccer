import { z } from "zod";
import { createRsvp, deleteRsvp, listRsvps } from "@/lib/rsvp-service";
import { consume, getClientIp, RSVP_RATE_LIMIT } from "@/lib/rate-limit";
import {
  badRequest,
  conflict,
  created,
  notFound,
  requireAdmin,
  serverError,
  success,
  tooManyRequests,
  validate,
} from "@/lib/api-helpers";

const participantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or less"),
  whatsapp: z.string().trim().regex(/^[0-9]{10,15}$/, "Invalid WhatsApp number format"),
  jerseySize: z.string().trim().min(1, "Jersey size is required").max(10, "Jersey size is too long"),
});

const rsvpSchema = z.object({
  matchId: z.string().trim().min(1, "Match ID is required"),
  participants: z
    .array(participantSchema)
    .min(1, "At least one participant is required")
    .max(10, "Maximum 10 participants per RSVP"),
});

const deleteRsvpSchema = z.object({
  id: z.string().trim().min(1, "RSVP ID is required"),
});

export async function GET(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId") || undefined;
    return success(await listRsvps(matchId));
  } catch (error) {
    return serverError(error, "Failed to fetch RSVPs");
  }
}

export async function POST(req: Request) {
  const limited = await consume("rsvp", getClientIp(req), RSVP_RATE_LIMIT);
  if (!limited.allowed) {
    return tooManyRequests(
      "Too many RSVP attempts. Please wait a few minutes.",
      limited.retryAfterMs
    );
  }

  return validate(req, rsvpSchema, async (data) => {
    try {
      const result = await createRsvp(data);

      if (result.kind === "not_found") return notFound("Match not found");
      if (result.kind === "closed") return conflict("RSVP is closed for this match");
      if (result.kind === "no_slots") return badRequest("Not enough slots available");
      if (result.kind === "duplicate") {
        return badRequest("One or more WhatsApp numbers are already registered for the match", {
          duplicates: result.duplicates,
        });
      }

      return created({
        id: result.id,
        matchId: data.matchId,
        participants: data.participants,
        registeredAt: result.registeredAt,
      });
    } catch (error) {
      return serverError(error, "Failed to create RSVP");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const validation = deleteRsvpSchema.safeParse({ id });
  if (!validation.success) {
    return badRequest("RSVP ID is required");
  }

  try {
    const result = await deleteRsvp(validation.data.id);
    if (result.kind === "not_found") return notFound("RSVP not found");

    return success({ message: "RSVP deleted successfully" });
  } catch (error) {
    return serverError(error, "Failed to delete RSVP");
  }
}
