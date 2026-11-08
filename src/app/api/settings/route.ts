import { z } from "zod";
import { withTransaction } from "@/lib/db";
import { fetchSettings, invalidateDataCache } from "@/lib/data";
import { buildUpdate } from "@/lib/sql";
import { isAllowedImageUrl } from "@/lib/validation";
import {
  badRequest,
  requireAdmin,
  serverError,
  success,
  validate,
} from "@/lib/api-helpers";

// --- Zod Schema ---

const settingsSchema = z.object({
  communityName: z.string().trim().min(2, "Community name must be at least 2 characters").max(50, "Community name must be 50 characters or less"),
  description: z.string().trim().max(500, "Description must be 500 characters or less").or(z.literal("")).optional(),
  logoUrl: z.string().trim().refine(isAllowedImageUrl, "Invalid image URL").optional(),
  bannerUrl: z.string().trim().refine(isAllowedImageUrl, "Invalid image URL").optional(),
  whatsapp: z.string().trim().regex(/^[0-9]{10,15}$/, "Invalid WhatsApp number").or(z.literal("")).optional(),
  instagram: z.string().trim().regex(/^[a-zA-Z0-9_.]+$/, "Invalid Instagram handle").or(z.literal("")).optional(),
  location: z.string().trim().max(255, "Location must be 255 characters or less").or(z.literal("")).optional(),
  googleMapsEmbed: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || value.startsWith("https://www.google.com/"),
      "Google Maps embed must use https://www.google.com/"
    )
    .optional(),
});

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

// --- Route Handlers ---

export async function GET() {
  try {
    return success(await fetchSettings());
  } catch (e) {
    return serverError(e, "Failed to fetch settings");
  }
}

export async function PUT(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  return validate(req, settingsSchema.partial(), async (data) => {
    const plan = buildUpdate("settings", "id", "default", fieldMapping, data);
    if (!plan) {
      return badRequest("No fields to update");
    }

    try {
      await withTransaction(async (client) => {
        const current = await client.query(
          "SELECT id FROM settings WHERE id = 'default' FOR UPDATE"
        );
        if (current.rowCount === 0) {
          await client.query(
            `INSERT INTO settings (id, community_name) VALUES ('default', 'Clash.Soccer')`
          );
        }
        await client.query(plan.text, plan.values);
      });

      invalidateDataCache();
      return success(await fetchSettings());
    } catch (e) {
      return serverError(e, "Failed to update settings");
    }
  });
}
