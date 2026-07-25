import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  badRequest,
  isNonEmptyString,
  isValidDateString,
  isValidTimeString,
  notFound,
  requireAdmin,
  serverError,
  toNonNegativeInteger,
  toPositiveInteger,
} from "@/lib/api-helpers";

const MATCH_STATUSES = ["upcoming", "completed", "ongoing"] as const;

// Helper to convert DB snake_case to frontend camelCase
function mapMatch(row: any) {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const res = await query("SELECT * FROM matches WHERE id = $1", [id]);
      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      return NextResponse.json(mapMatch(res.rows[0]));
    }

    const res = await query("SELECT * FROM matches ORDER BY date DESC, time DESC");
    return NextResponse.json(res.rows.map(mapMatch));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, title, date, time, location, status } = body;
    const slotsTotal = toPositiveInteger(body.slotsTotal);
    const slotsAvailable = toNonNegativeInteger(body.slotsAvailable ?? body.slotsTotal);
    const safeStatus = status || "upcoming";

    if (!isNonEmptyString(id) || !isNonEmptyString(title) || !isValidDateString(date) || !isValidTimeString(time) || !isNonEmptyString(location)) {
      return badRequest("Invalid match data");
    }

    if (slotsTotal === null || slotsAvailable === null || slotsAvailable > slotsTotal) {
      return badRequest("Invalid slot data");
    }

    if (!MATCH_STATUSES.includes(safeStatus)) {
      return badRequest("Invalid match status");
    }

    await query(
      `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id.trim(), title.trim(), date, time, location.trim(), slotsTotal, slotsAvailable, safeStatus]
    );

    const res = await query("SELECT * FROM matches ORDER BY date DESC, time DESC");
    return NextResponse.json(res.rows.map(mapMatch));
  } catch (error) {
    return serverError(error, "Failed to create match");
  }
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!isNonEmptyString(id)) {
      return badRequest("Match ID is required");
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (updates.title !== undefined) {
      if (!isNonEmptyString(updates.title)) return badRequest("Invalid title");
      fields.push(`title = $${i++}`);
      values.push(updates.title.trim());
    }
    if (updates.date !== undefined) {
      if (!isValidDateString(updates.date)) return badRequest("Invalid date");
      fields.push(`date = $${i++}`);
      values.push(updates.date);
    }
    if (updates.time !== undefined) {
      if (!isValidTimeString(updates.time)) return badRequest("Invalid time");
      fields.push(`time = $${i++}`);
      values.push(updates.time);
    }
    if (updates.location !== undefined) {
      if (!isNonEmptyString(updates.location)) return badRequest("Invalid location");
      fields.push(`location = $${i++}`);
      values.push(updates.location.trim());
    }
    if (updates.slotsTotal !== undefined) {
      const slotsTotal = toPositiveInteger(updates.slotsTotal);
      if (slotsTotal === null) return badRequest("Invalid total slots");
      fields.push(`slots_total = $${i++}`);
      values.push(slotsTotal);
    }
    if (updates.slotsAvailable !== undefined) {
      const slotsAvailable = toNonNegativeInteger(updates.slotsAvailable);
      if (slotsAvailable === null) return badRequest("Invalid available slots");
      fields.push(`slots_available = $${i++}`);
      values.push(slotsAvailable);
    }
    if (updates.status !== undefined) {
      if (!MATCH_STATUSES.includes(updates.status)) return badRequest("Invalid match status");
      fields.push(`status = $${i++}`);
      values.push(updates.status);
    }

    if (fields.length > 0) {
      values.push(id.trim());
      const updated = await query(
        `UPDATE matches SET ${fields.join(", ")} WHERE id = $${i}`,
        values
      );

      if (updated.rowCount === 0) return notFound("Match not found");
    }

    const res = await query("SELECT * FROM matches ORDER BY date DESC, time DESC");
    return NextResponse.json(res.rows.map(mapMatch));
  } catch (error) {
    return serverError(error, "Failed to update match");
  }
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!isNonEmptyString(id)) {
      return badRequest("Match ID is required");
    }

    const deleted = await query("DELETE FROM matches WHERE id = $1", [id.trim()]);
    if (deleted.rowCount === 0) return notFound("Match not found");

    const res = await query("SELECT * FROM matches ORDER BY date DESC, time DESC");
    return NextResponse.json(res.rows.map(mapMatch));
  } catch (error) {
    return serverError(error, "Failed to delete match");
  }
}
