import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  badRequest,
  isNonEmptyString,
  requireAdmin,
  serverError,
} from "@/lib/api-helpers";

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
  } catch (error) {
    return serverError(error, "Failed to fetch settings");
  }
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();

    const fields: string[] = [];
    const values: string[] = [];
    let idx = 1;

    const addTextField = (apiKey: string, dbKey: string, required = false) => {
      if (body[apiKey] === undefined) return null;
      if (required && !isNonEmptyString(body[apiKey])) return `Invalid ${apiKey}`;

      fields.push(`${dbKey} = $${idx++}`);
      values.push(isNonEmptyString(body[apiKey]) ? body[apiKey].trim() : "");
      return null;
    };

    const validationError =
      addTextField("communityName", "community_name", true) ||
      addTextField("description", "description") ||
      addTextField("logoUrl", "logo_url") ||
      addTextField("bannerUrl", "banner_url") ||
      addTextField("whatsapp", "whatsapp") ||
      addTextField("instagram", "instagram") ||
      addTextField("location", "location") ||
      addTextField("googleMapsEmbed", "google_maps_embed");

    if (validationError) return badRequest(validationError);

    if (fields.length > 0) {
      const updated = await query(
        `UPDATE settings SET ${fields.join(", ")} WHERE id = 'default'`,
        values
      );

      if (updated.rowCount === 0) {
        await query(
          `INSERT INTO settings (id, community_name, description, logo_url, banner_url, whatsapp, instagram, location, google_maps_embed)
           VALUES ('default', '', '', '', '', '', '', '', '')`
        );
        await query(
          `UPDATE settings SET ${fields.join(", ")} WHERE id = 'default'`,
          values
        );
      }
    }

    const res = await query("SELECT * FROM settings WHERE id = 'default'");
    return NextResponse.json(mapSettings(res.rows[0]));
  } catch (error) {
    return serverError(error, "Failed to update settings");
  }
}