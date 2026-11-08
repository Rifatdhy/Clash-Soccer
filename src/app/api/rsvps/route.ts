import { randomUUID } from "crypto";
import { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { invalidateDataCache } from "@/lib/data";
import { consume, getClientIp, RSVP_RATE_LIMIT } from "@/lib/rate-limit";
import { canReserve, restoreSlots } from "@/lib/slots";
import { duplicateWhatsAppNumbers } from "@/lib/rsvp-utils";
import {
  badRequest,
  created,
  notFound,
  requireAdmin,
  serverError,
  success,
  tooManyRequests,
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

function parseParticipants(raw: unknown): ParticipantRow[] {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse participants JSON", e);
      return [];
    }
  }
  return Array.isArray(parsed) ? (parsed as ParticipantRow[]) : [];
}

function mapRsvp(row: RsvpQueryRow): RsvpEntry {
  const mappedParticipants = parseParticipants(row.participants).map(
    (participant): Participant => ({
      name: participant.name || "",
      whatsapp: participant.whatsapp || participant.phone || "",
      jerseySize: participant.jerseySize || participant.jersey_size || "M",
    })
  );

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
  const limited = consume("rsvp", getClientIp(req), RSVP_RATE_LIMIT);
  if (!limited.allowed) {
    return tooManyRequests("Too many RSVP attempts. Please wait a few minutes.");
  }

  return validate(req, rsvpSchema, async (data) => {
    const { matchId, participants } = data;

    try {
      const result = await withTransaction(async (client) => {
        // Lock the match row so concurrent RSVPs cannot oversell the slots.
        const matchRes = await client.query<{ slots_available: number }>(
          "SELECT slots_available FROM matches WHERE id = $1 FOR UPDATE",
          [matchId]
        );
        if (matchRes.rowCount === 0) {
          return { kind: "not_found" as const };
        }

        const { slots_available } = matchRes.rows[0];
        if (!canReserve(slots_available, participants.length)) {
          return { kind: "no_slots" as const };
        }

        const existingRes = await client.query<{ participants: unknown }>(
          "SELECT participants FROM rsvps WHERE match_id = $1",
          [matchId]
        );
        const existing = existingRes.rows.flatMap((row) => parseParticipants(row.participants));
        const duplicates = duplicateWhatsAppNumbers(existing, participants);
        if (duplicates.length > 0) {
          return { kind: "duplicate" as const, duplicates };
        }

        const id = `rsvp-${randomUUID()}`;
        const registeredAt = new Date().toISOString();

        await client.query(
          "INSERT INTO rsvps (id, match_id, participants, registered_at) VALUES ($1, $2, $3, $4)",
          [id, matchId, JSON.stringify(participants), registeredAt]
        );

        await client.query(
          "UPDATE matches SET slots_available = $1 WHERE id = $2",
          [slots_available - participants.length, matchId]
        );

        return { kind: "ok" as const, id, registeredAt };
      });

      if (result.kind === "not_found") return notFound("Match not found");
      if (result.kind === "no_slots") return badRequest("Not enough slots available");
      if (result.kind === "duplicate") {
        return badRequest("One or more WhatsApp numbers are already registered for the match", {
          duplicates: result.duplicates,
        });
      }

      invalidateDataCache();
      return created({
        id: result.id,
        matchId,
        participants,
        registeredAt: result.registeredAt,
      });
    } catch (e) {
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
    const result = await withTransaction(async (client) => {
      const rsvpRes = await client.query<{ match_id: string; participants: unknown }>(
        "SELECT match_id, participants FROM rsvps WHERE id = $1 FOR UPDATE",
        [validation.data.id]
      );
      if (rsvpRes.rowCount === 0) {
        return { kind: "not_found" as const };
      }

      const { match_id, participants } = rsvpRes.rows[0];
      const participantCount = parseParticipants(participants).length;

      await client.query("DELETE FROM rsvps WHERE id = $1", [validation.data.id]);

      const matchRes = await client.query<{ slots_total: number; slots_available: number }>(
        "SELECT slots_total, slots_available FROM matches WHERE id = $1 FOR UPDATE",
        [match_id]
      );
      if (matchRes.rows[0]) {
        const { slots_total, slots_available } = matchRes.rows[0];
        await client.query("UPDATE matches SET slots_available = $1 WHERE id = $2", [
          restoreSlots(slots_total, slots_available, participantCount),
          match_id,
        ]);
      }

      return { kind: "ok" as const };
    });

    if (result.kind === "not_found") return notFound("RSVP not found");

    invalidateDataCache();
    return success({ message: "RSVP deleted successfully" });
  } catch (e) {
    return serverError(e, "Failed to delete RSVP");
  }
}
