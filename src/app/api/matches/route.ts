import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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
  try {
    const body = await req.json();
    const { id, title, date, time, location, slotsTotal, slotsAvailable, status } = body;
    
    await query(
      `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, title, date, time, location, slotsTotal, slotsAvailable, status || "upcoming"]
    );
    
    const res = await query("SELECT * FROM matches ORDER BY date DESC, time DESC");
    return NextResponse.json(res.rows.map(mapMatch));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }

    // Dynamic update query builder
    const fields = [];
    const values = [];
    let i = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${i++}`);
      values.push(updates.title);
    }
    if (updates.date !== undefined) {
      fields.push(`date = $${i++}`);
      values.push(updates.date);
    }
    if (updates.time !== undefined) {
      fields.push(`time = $${i++}`);
      values.push(updates.time);
    }
    if (updates.location !== undefined) {
      fields.push(`location = $${i++}`);
      values.push(updates.location);
    }
    if (updates.slotsTotal !== undefined) {
      fields.push(`slots_total = $${i++}`);
      values.push(updates.slotsTotal);
    }
    if (updates.slotsAvailable !== undefined) {
      fields.push(`slots_available = $${i++}`);
      values.push(updates.slotsAvailable);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${i++}`);
      values.push(updates.status);
    }

    if (fields.length > 0) {
      values.push(id);
      await query(
        `UPDATE matches SET ${fields.join(", ")} WHERE id = $${i}`,
        values
      );
    }

    const res = await query("SELECT * FROM matches ORDER BY date DESC, time DESC");
    return NextResponse.json(res.rows.map(mapMatch));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }

    await query("DELETE FROM matches WHERE id = $1", [id]);
    
    const res = await query("SELECT * FROM matches ORDER BY date DESC, time DESC");
    return NextResponse.json(res.rows.map(mapMatch));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}