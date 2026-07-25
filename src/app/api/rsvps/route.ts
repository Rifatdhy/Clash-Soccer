import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper to convert DB keys to frontend camelCase
function mapRsvp(row: any) {
  return {
    id: row.id,
    matchId: row.match_id,
    participants: row.participants,
    createdAt: row.created_at || row.registered_at,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");
    
    let res;
    if (matchId) {
      res = await query("SELECT * FROM rsvps WHERE match_id = $1 ORDER BY created_at DESC", [matchId]);
    } else {
      res = await query("SELECT * FROM rsvps ORDER BY created_at DESC");
    }
    
    return NextResponse.json(res.rows.map(mapRsvp));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, participants } = body;
    
    if (!matchId || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ error: "Missing matchId or participants list" }, { status: 400 });
    }

    const id = `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const registeredAt = new Date().toISOString();

    // Begin Transaction to prevent race conditions
    await query("BEGIN");
    
    // Check available slots
    const matchRes = await query("SELECT slots_available, slots_total FROM matches WHERE id = $1 FOR UPDATE", [matchId]);
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
      [id, matchId, JSON.stringify(participants), registeredAt]
    );

    // Update match slots
    await query(
      `UPDATE matches SET slots_available = slots_available - $1 WHERE id = $2`,
      [newParticipantsCount, matchId]
    );

    await query("COMMIT");

    return NextResponse.json({
      id,
      matchId,
      participants,
      registeredAt,
    });
  } catch (error: any) {
    await query("ROLLBACK");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}