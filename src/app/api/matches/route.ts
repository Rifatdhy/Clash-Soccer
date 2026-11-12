import { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { fetchMatch, fetchMatches, invalidateDataCache } from "@/lib/data";
import { matchCreateSchema, matchUpdateSchema } from "@/lib/match-schema";
import { buildUpdate } from "@/lib/sql";
import { availableAfterTotalChange, slotsWithinLimits } from "@/lib/slots";
import { isUniqueViolation } from "@/lib/pg-errors";
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

// --- Zod Schemas ---

const deleteMatchSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
});

const fieldMapping: Record<string, string> = {
  title: "title",
  date: "date",
  time: "time",
  location: "location",
  slotsTotal: "slots_total",
  slotsAvailable: "slots_available",
  status: "status",
};

// --- Route Handlers ---

export async function GET(req: Request) {
  // Public route, no admin check needed to view matches
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || undefined;

    if (id) {
      const match = await fetchMatch(id);
      if (!match) return notFound("Match not found");
      return success(match);
    }

    return success(await fetchMatches());
  } catch (e) {
    return serverError(e, "Failed to fetch matches");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  return validate(req, matchCreateSchema, async (data) => {
    const { id, title, date, time, location, slotsTotal, status } = data;
    const slotsAvailable = data.slotsAvailable ?? slotsTotal;

    try {
      await query(
        `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, title, date, time, location, slotsTotal, slotsAvailable, status]
      );

      invalidateDataCache();
      return created(await fetchMatches());
    } catch (e) {
      if (isUniqueViolation(e)) {
        return conflict("A match with this ID already exists");
      }
      return serverError(e, "Failed to create match");
    }
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  return validate(req, matchUpdateSchema, async (data) => {
    const { id, ...updates } = data;

    try {
      const result = await withTransaction(async (client) => {
        let effectiveUpdates: Record<string, unknown> = { ...updates };

        // Slot writes are validated against the row that is actually stored, not
        // just against the fields present in this request. A PUT that sends only
        // `slotsTotal` still has to keep availability inside the new total.
        if (updates.slotsTotal !== undefined || updates.slotsAvailable !== undefined) {
          const current = await client.query<{ slots_total: number; slots_available: number }>(
            "SELECT slots_total, slots_available FROM matches WHERE id = $1 FOR UPDATE",
            [id]
          );
          if (!current.rows[0]) {
            return { kind: "not_found" as const };
          }

          const { slots_total, slots_available } = current.rows[0];
          const total = updates.slotsTotal ?? slots_total;
          const available =
            updates.slotsTotal !== undefined && updates.slotsAvailable === undefined
              ? availableAfterTotalChange(slots_total, slots_available, updates.slotsTotal)
              : (updates.slotsAvailable ?? slots_available);

          if (!slotsWithinLimits(total, available)) {
            return { kind: "invalid_slots" as const };
          }

          effectiveUpdates = {
            ...effectiveUpdates,
            slotsAvailable: available,
          };
        }

        const plan = buildUpdate("matches", "id", id, fieldMapping, effectiveUpdates);
        if (!plan) {
          return { kind: "no_fields" as const };
        }

        const res = await client.query(plan.text, plan.values);
        if (res.rowCount === 0) {
          return { kind: "not_found" as const };
        }

        return { kind: "ok" as const };
      });

      if (result.kind === "no_fields") return badRequest("No fields to update");
      if (result.kind === "invalid_slots")
        return badRequest("Available slots cannot exceed total slots");
      if (result.kind === "not_found") return notFound("Match not found");

      invalidateDataCache();
      return success(await fetchMatches());
    } catch (e) {
      return serverError(e, "Failed to update match");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const validation = deleteMatchSchema.safeParse({ id });
  if (!validation.success) {
    return badRequest("Match ID is required");
  }

  try {
    const res = await query("DELETE FROM matches WHERE id = $1", [validation.data.id]);
    if (res.rowCount === 0) {
      return notFound("Match not found");
    }

    invalidateDataCache();
    return success(await fetchMatches());
  } catch (e) {
    return serverError(e, "Failed to delete match");
  }
}
