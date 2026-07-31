import { z } from "zod";
import { query } from "@/lib/db";
import {
  badRequest,
  created,
  notFound,
  requireAdmin,
  serverError,
  success,
  validate,
} from "@/lib/api-helpers";
import type { Match } from "@/types";

// --- Zod Schemas ---

const baseMatchSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  location: z.string().trim().min(1, "Location is required"),
  slotsTotal: z.number().int().positive("Total slots must be a positive number"),
  slotsAvailable: z.number().int().nonnegative("Available slots must be a non-negative number").optional(),
  status: z.enum(["upcoming", "completed", "ongoing"]).default("upcoming"),
});

const matchSchema = baseMatchSchema.refine((data) => data.slotsAvailable === undefined || data.slotsAvailable <= data.slotsTotal, {
  message: "Available slots cannot exceed total slots",
  path: ["slotsAvailable"],
});

const updateMatchSchema = baseMatchSchema.partial().required({ id: true });

const deleteMatchSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
});


// --- Types ---

interface MatchRow {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  slots_total: number;
  slots_available: number;
  status: "upcoming" | "completed" | "ongoing";
}

// --- Helper Functions ---

function mapMatch(row: MatchRow): Match {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    location: row.location,
    slotsTotal: row.slots_total,
    slotsAvailable: row.slots_available,
    status: row.status,
  };
}

async function getMatches(id?: string) {
  if (id) {
    const res = await query<MatchRow>("SELECT * FROM matches WHERE id = $1", [id]);
    return res.rows.map(mapMatch);
  }
  const res = await query<MatchRow>("SELECT * FROM matches ORDER BY date DESC, time DESC");
  return res.rows.map(mapMatch);
}

// --- Route Handlers ---

export async function GET(req: Request) {
  // Public route, no admin check needed to view matches
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || undefined;
    const matches = await getMatches(id);
    if (id && matches.length === 0) {
      return notFound("Match not found");
    }
    return success(id ? matches[0] : matches);
  } catch (e) {
    console.error("Error in GET /api/matches:", e);
    return serverError(e, "Failed to fetch matches");
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, matchSchema, async (data) => {
    const { id, title, date, time, location, slotsTotal, status } = data;
    const slotsAvailable = data.slotsAvailable ?? slotsTotal;

    try {
      await query(
        `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, title, date, time, location, slotsTotal, slotsAvailable, status]
      );
      const matches = await getMatches();
      return created(matches);
    } catch (e) {
      return serverError(e, "Failed to create match");
    }
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, updateMatchSchema, async (data) => {
    const { id, ...updates } = data;
    try {
      const fields: string[] = [];
      const values: (string | number | boolean)[] = [];
      let idx = 1;

      const fieldMapping: Record<string, string> = {
        title: "title",
        date: "date",
        time: "time",
        location: "location",
        slotsTotal: "slots_total",
        slotsAvailable: "slots_available",
        status: "status",
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
        `UPDATE matches SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );

      if (res.rowCount === 0) {
        return notFound("Match not found");
      }

      const updatedMatches = await getMatches();
      return success(updatedMatches);
    } catch (e) {
      return serverError(e, "Failed to update match");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
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
    const updatedMatches = await getMatches();
    return success(updatedMatches);
  } catch (e) {
    return serverError(e, "Failed to delete match");
  }
}
