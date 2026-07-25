import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { albumId, id, type, url, thumbnailUrl } = body;

    if (!albumId || !id || !url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await query(
      `INSERT INTO album_items (id, album_id, type, url, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, albumId, type || "image", url, thumbnailUrl || null]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    await query("DELETE FROM album_items WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}