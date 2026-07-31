import { z } from "zod";
import { query } from "@/lib/db";
import {
  badRequest,
  notFound,
  requireAdmin,
  serverError,
  success,
  validate,
} from "@/lib/api-helpers";
import type { Setting } from "@/types";

// --- Zod Schema ---

const settingsSchema = z.object({
  communityName: z.string().trim().min(2, "Community name must be at least 2 characters").max(50, "Community name must be 50 characters or less"),
  description: z.string().trim().max(500, "Description must be 500 characters or less").or(z.literal("")).optional(),
  logoUrl: z.string().trim().or(z.literal("")).optional(),
  bannerUrl: z.string().trim().or(z.literal("")).optional(),
  whatsapp: z.string().trim().regex(/^[0-9]{10,15}$/, "Invalid WhatsApp number").or(z.literal("")).optional(),
  instagram: z.string().trim().regex(/^[a-zA-Z0-9_.]+$/, "Invalid Instagram handle").or(z.literal("")).optional(),
  location: z.string().trim().max(255, "Location must be 255 characters or less").or(z.literal("")).optional(),
  googleMapsEmbed: z.string().trim().or(z.literal("")).optional(),
});

// --- Types ---

interface SettingsRow {
  community_name: string;
  description: string;
  logo_url: string;
  banner_url: string;
  whatsapp: string;
  instagram: string;
  location: string;
  google_maps_embed: string;
}

// --- Helper Functions ---

function mapSettings(row: SettingsRow): Setting {
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

async function getSettings() {
  const res = await query<SettingsRow>("SELECT * FROM settings WHERE id = 'default'");
  if (res.rowCount === 0) {
    return null;
  }
  return mapSettings(res.rows[0]);
}

// --- Route Handlers ---

export async function GET() {
  try {
    const settings = await getSettings();
    if (!settings) {
      return notFound("Settings not found");
    }
    return success(settings);
  } catch (e) {
    return serverError(e, "Failed to fetch settings");
  }
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, settingsSchema.partial(), async (data) => {
    if (Object.keys(data).length === 0) {
      return badRequest("No fields to update");
    }

    try {
      await query("BEGIN");

      const currentSettings = await query<{ id: string }>("SELECT id FROM settings WHERE id = 'default' FOR UPDATE");
      if (currentSettings.rowCount === 0) {
        await query(
          `INSERT INTO settings (id, community_name) VALUES ('default', 'My Community')`
        );
      }

      const fields: string[] = [];
      const values: (string | number | boolean)[] = [];
      let idx = 1;

      const fieldMapping: Record<string, string> = {
        communityName: "community_name",
        description: "description",
        logoUrl: "logo_url",
        bannerUrl: "banner_url",
        whatsapp: "whatsapp",
        instagram: "instagram",
        location: "location",
        googleMapsEmbed: "google_maps_embed",
      };

      const updateMap = data as Record<string, string | undefined>;

      for (const key in updateMap) {
        if (Object.prototype.hasOwnProperty.call(updateMap, key) && fieldMapping[key]) {
          const value = updateMap[key];
          if (value !== undefined) {
            fields.push(`${fieldMapping[key]} = $${idx++}`);
            values.push(value);
          }
        }
      }

      if (fields.length > 0) {
        await query(`UPDATE settings SET ${fields.join(", ")} WHERE id = 'default'`, values);
      }

      await query("COMMIT");

      const updatedSettings = await getSettings();
      return success(updatedSettings);
    } catch (e) {
      await query("ROLLBACK");
      return serverError(e, "Failed to update settings");
    }
  });
}
