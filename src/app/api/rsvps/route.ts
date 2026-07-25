import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  badRequest,
  isNonEmptyString,
  notFound,
  requireAdmin,
  serverError,
} from "@/lib/api-helpers";

// Helper to convert DB keys to frontend camelCase
function mapRsvp(row: any) {
  return {
    id: row.id,
    matchId: row.match_id,
    matchTitle: row.match_title,
    matchDate: row.match_date,
    matchTime: row.match_time,
    participants: typeof row.participants === "string" ? JSON.parse(row.participants) : row.participants,
    totalParticipants: Array.isArray(row.participants) ? row.participants.length : 0,
    createdAt: row.created_at || row.registered_at,
  };
}

function validateParticipants(participants: unknown) {
  if (!Array.isArray(participants) || participants.length === 0) {
    return "Participants list is required";
  }

  if (participants.length > 10) {
    return "Maximum 10 participants per RSVP";
  }

  for (const participant of participants) {
    if (!isNonEmptyString(participant?.name)) return "Participant name is required";
    if (!isNonEmptyString(participant?.whatsapp) && !isNonEmptyString(participant?.phone)) {
      return "Participant WhatsApp is required";
    }
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");
    
    let res;
    if (matchId) {
      res = await query(
        `SELECT rsvps.*, matches.title as match_title, matches.date as match_date, matches.time as match_time
         FROM rsvps
         LEFT JOIN matches ON matches.id = rsvps.match_id
         WHERE rsvps.match_id = $1
         ORDER BY rsvps.created_at DESC`,
        [matchId]
      );
    } else {
      res = await query(
        `SELECT rsvps.*, matches.title as match_title, matches.date as match_date, matches.time as match_time
         FROM rsvps
         LEFT JOIN matches ON matches.id = rsvps.match_id
         ORDER BY rsvps.created_at DESC`
      );
    }
    
    return NextResponse.json(res.rows.map(mapRsvp));
  } catch (error) {
    return serverError(error, "Failed to fetch RSVPs");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, participants } = body;
    
    if (!isNonEmptyString(matchId)) {
      return badRequest("Match ID is required");
    }

    const participantError = validateParticipants(participants);
    if (participantError) return badRequest(participantError);

    const id = `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const registeredAt = new Date().toISOString();

    // Begin Transaction to prevent race conditions
    await query("BEGIN");
    
    // Check available slots
    const matchRes = await query("SELECT slots_available, slots_total FROM matches WHERE id = $1 FOR UPDATE", [matchId.trim()]);
    if (matchRes.rowCount === 0) {
      await query("ROLLBACK");
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    
    const { slots_available } = matchRes.rows[0];
    const newParticipantsCount = participants.length;
    
    if (slots_available < newParticipantsCount) {
      await query("ROLLBACK");
      return NextResponse.json({ error: "Not enough slots available" }, { status: 400 });
    }

    // Insert RSVP
    await query(
      `INSERT INTO rsvps (id, match_id, participants, registered_at)
       VALUES ($1, $2, $3, $4)`,
      [id, matchId.trim(), JSON.stringify(participants), registeredAt]
    );

    // Update match slots
    await query(
      `UPDATE matches SET slots_available = slots_available - $1 WHERE id = $2`,
      [newParticipantsCount, matchId.trim()]
    );

    await query("COMMIT");

    return NextResponse.json({
      id,
      matchId: matchId.trim(),
      participants,
      registeredAt,
    });
  } catch (error) {
    await query("ROLLBACK");
    return serverError(error, "Failed to create RSVP");
  }
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!isNonEmptyString(id)) {
      return badRequest("RSVP ID is required");
    }

    await query("BEGIN");

    const rsvpRes = await query("SELECT match_id, participants FROM rsvps WHERE id = $1 FOR UPDATE", [id.trim()]);
    if (rsvpRes.rowCount === 0) {
      await query("ROLLBACK");
      return notFound("RSVP not found");
    }

    const rsvp = rsvpRes.rows[0];
    const participants = typeof rsvp.participants === "string" ? JSON.parse(rsvp.participants) : rsvp.participants;
    const participantCount = Array.isArray(participants) ? participants.length : 0;

    await query("DELETE FROM rsvps WHERE id = $1", [id.trim()]);
    await query(
      `UPDATE matches
       SET slots_available = LEAST(slots_total, slots_available + $1)
       WHERE id = $2`,
      [participantCount, rsvp.match_id]
    );

    await query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await query("ROLLBACK");
    return serverError(error, "Failed to delete RSVP");
  }
}
