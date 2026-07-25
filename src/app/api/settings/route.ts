import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Helper to convert DB keys to frontend camelCase
function mapSettings(row: any) {
  return {
    communityName: row.community_name,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    location: row.location,
    googleMapsEmbed: row.google_maps_embed,
  };
}

export async function GET() {
  try {
    const res = await query("SELECT * FROM settings WHERE id = 'default'");
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }
    return NextResponse.json(mapSettings(res.rows[0]));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    
    const fields = [];
    const values = [];
    let idx = 1;

    if (body.communityName !== undefined) {
      fields.push(`community_name = $${idx++}`);
      values.push(body.communityName);
    }
    if (body.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(body.description);
    }
    if (body.logoUrl !== undefined) {
      fields.push(`logo_url = $${idx++}`);
      values.push(body.logoUrl);
    }
    if (body.bannerUrl !== undefined) {
      fields.push(`banner_url = $${idx++}`);
      values.push(body.bannerUrl);
    }
    if (body.whatsapp !== undefined) {
      fields.push(`whatsapp = $${idx++}`);
      values.push(body.whatsapp);
    }
    if (body.instagram !== undefined) {
      fields.push(`instagram = $${idx++}`);
      values.push(body.instagram);
    }
    if (body.location !== undefined) {
      fields.push(`location = $${idx++}`);
      values.push(body.location);
    }
    if (body.googleMapsEmbed !== undefined) {
      fields.push(`google_maps_embed = $${idx++}`);
      values.push(body.googleMapsEmbed);
    }

    if (fields.length > 0) {
      await query(
        `UPDATE settings SET ${fields.join(", ")} WHERE id = 'default'`,
        values
      );
    }

    const res = await query("SELECT * FROM settings WHERE id = 'default'");
    return NextResponse.json(mapSettings(res.rows[0]));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}