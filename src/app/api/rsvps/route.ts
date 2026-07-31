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
import type { Participant, RsvpEntry } from "@/types";

// --- Zod Schemas ---

const participantSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or less"),
  whatsapp: z.string().trim().regex(/^[0-9]{10,15}$/, "Invalid WhatsApp number format"),
  jerseySize: z.string().trim().min(1, "Jersey size is required").max(10, "Jersey size is too long"),
});

const rsvpSchema = z.object({
  matchId: z.string().trim().min(1, "Match ID is required"),
  participants: z.array(participantSchema).min(1, "At least one participant is required").max(10, "Maximum 10 participants per RSVP"),
});

const deleteRsvpSchema = z.object({
  id: z.string().trim().min(1, "RSVP ID is required"),
});

// --- Helper Functions ---

interface RsvpQueryRow {
  id: string;
  match_id: string;
  participants: unknown;
  registered_at: string;
  created_at: string;
  match_title: string;
  match_date: string;
  match_time: string;
}

interface ParticipantRow {
  name?: string;
  whatsapp?: string;
  phone?: string;
  jerseySize?: string;
  jersey_size?: string;
}

function mapRsvp(row: RsvpQueryRow): RsvpEntry {
  let participants: unknown[] = [];
  try {
    const parsed = typeof row.participants === "string"
      ? JSON.parse(row.participants)
      : row.participants;
    participants = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse participants JSON", e);
  }

  const mappedParticipants = participants.map((participant): Participant => {
    const p = (participant ?? {}) as ParticipantRow;
    return {
      name: p.name || "",
      whatsapp: p.whatsapp || p.phone || "",
      jerseySize: p.jerseySize || p.jersey_size || "M",
    };
  });

  return {
    id: row.id,
    matchId: row.match_id,
    matchTitle: row.match_title,
    matchDate: row.match_date,
    matchTime: row.match_time,
    participants: mappedParticipants,
    totalParticipants: mappedParticipants.length,
    createdAt: row.created_at || row.registered_at,
  };
}

async function getRsvps(matchId?: string) {
  let res;
  if (matchId) {
    res = await query<RsvpQueryRow>(
      `SELECT r.*, m.title as match_title, m.date as match_date, m.time as match_time, r.created_at as registered_at
       FROM rsvps r 
       LEFT JOIN matches m ON m.id = r.match_id
       WHERE r.match_id = $1 ORDER BY r.created_at DESC`,
      [matchId]
    );
  } else {
    res = await query<RsvpQueryRow>(
      `SELECT r.*, m.title as match_title, m.date as match_date, m.time as match_time, r.created_at as registered_at
       FROM rsvps r 
       LEFT JOIN matches m ON m.id = r.match_id
       ORDER BY r.created_at DESC`
    );
  }
  return res.rows.map(mapRsvp);
}

// --- Route Handlers ---

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId") || undefined;
    const rsvps = await getRsvps(matchId);
    return success(rsvps);
  } catch (e) {
    return serverError(e, "Failed to fetch RSVPs");
  }
}

export async function POST(req: Request) {
  return validate(req, rsvpSchema, async (data) => {
    const { matchId, participants } = data;
    const id = `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const registeredAt = new Date().toISOString();

    try {
      await query("BEGIN");

      const matchRes = await query<{ slots_available: number }>(
        "SELECT slots_available FROM matches WHERE id = $1 FOR UPDATE", 
        [matchId.trim()]
      );
      if (matchRes.rowCount === 0) {
        await query("ROLLBACK");
        return notFound("Match not found");
      }

      const { slots_available } = matchRes.rows[0];
      if (slots_available < participants.length) {
        await query("ROLLBACK");
        return badRequest("Not enough slots available");
      }

      await query(
        `INSERT INTO rsvps (id, match_id, participants, registered_at) VALUES ($1, $2, $3, $4)`,
        [id, matchId.trim(), JSON.stringify(participants), registeredAt]
      );

      await query(
        `UPDATE matches SET slots_available = slots_available - $1 WHERE id = $2`,
        [participants.length, matchId.trim()]
      );

      await query("COMMIT");
      return created({ id, matchId: matchId.trim(), participants, registeredAt });
    } catch (e) {
      await query("ROLLBACK");
      return serverError(e, "Failed to create RSVP");
    }
  });
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const validation = deleteRsvpSchema.safeParse({ id });
  if (!validation.success) {
    return badRequest("RSVP ID is required");
  }

  try {
    await query("BEGIN");

    const rsvpRes = await query<{ match_id: string; participants: unknown }>(
      "SELECT match_id, participants FROM rsvps WHERE id = $1 FOR UPDATE", 
      [validation.data.id.trim()]
    );
    if (rsvpRes.rowCount === 0) {
      await query("ROLLBACK");
      return notFound("RSVP not found");
    }

    const { match_id, participants: rawParticipants } = rsvpRes.rows[0];
    let participantsList: unknown[] = [];
    try {
      participantsList = typeof rawParticipants === "string"
        ? JSON.parse(rawParticipants)
        : (rawParticipants || []);
    } catch (e) {
      console.error("Failed to parse participants JSON during delete", e);
    }
    const participantCount = Array.isArray(participantsList) ? participantsList.length : 0;

    await query("DELETE FROM rsvps WHERE id = $1", [validation.data.id.trim()]);
    await query(
      `UPDATE matches SET slots_available = LEAST(slots_total, slots_available + $1) WHERE id = $2`,
      [participantCount, match_id]
    );

    await query("COMMIT");
    return success({ message: "RSVP deleted successfully" });
  } catch (e) {
    await query("ROLLBACK");
    return serverError(e, "Failed to delete RSVP");
  }
}