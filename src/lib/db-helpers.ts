/**
 * Database utility functions
 * Shared helpers for PostgreSQL queries
 */

type Primitive = string | number | boolean | Date | null;

interface FieldMapping {
  [camelCase: string]: string; // camelCase -> snake_case
}

interface UpdateQueryResult {
  query: string;
  values: Primitive[];
}

/**
 * Build dynamic UPDATE query with parameterized values
 * Prevents SQL injection and reduces code duplication
 *
 * @param tableName - Name of the table to update
 * @param id - ID of the record to update
 * @param updates - Object with camelCase keys and their new values
 * @param fieldMapping - Mapping of camelCase to snake_case column names
 * @returns Object with query string and values array, or null if no updates
 */
export function buildUpdateQuery(
  tableName: string,
  id: string,
  updates: Record<string, unknown>,
  fieldMapping: FieldMapping
): UpdateQueryResult | null {
  const fields: string[] = [];
  const values: Primitive[] = [];
  let paramIndex = 1;

  // Build SET clause
  for (const [camelKey, snakeColumn] of Object.entries(fieldMapping)) {
    if (updates[camelKey] !== undefined) {
      fields.push(`${snakeColumn} = $${paramIndex++}`);
      values.push(updates[camelKey] as Primitive);
    }
  }

  if (fields.length === 0) {
    return null; // No fields to update
  }

  // Add ID as final parameter
  values.push(id);
  const query = `UPDATE ${tableName} SET ${fields.join(", ")} WHERE id = $${paramIndex}`;

  return { query, values };
}

/**
 * Convert snake_case object keys to camelCase
 * Used for mapping database rows to frontend types
 */
export function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  
  return result as T;
}

/**
 * Convert camelCase object keys to snake_case
 * Used for preparing data for database insertion
 */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Field mappings for common entities
 */
export const FIELD_MAPPINGS = {
  match: {
    title: "title",
    date: "date",
    time: "time",
    location: "location",
    slotsTotal: "slots_total",
    slotsAvailable: "slots_available",
    status: "status",
  },
  news: {
    title: "title",
    slug: "slug",
    content: "content",
    excerpt: "excerpt",
    coverImage: "cover_image",
    date: "date",
  },
  album: {
    title: "title",
    matchDate: "match_date",
    coverUrl: "cover_url",
  },
  setting: {
    communityName: "community_name",
    description: "description",
    logoUrl: "logo_url",
    bannerUrl: "banner_url",
    whatsapp: "whatsapp",
    instagram: "instagram",
    location: "location",
    googleMapsEmbed: "google_maps_embed",
  },
  faq: {
    question: "question",
    answer: "answer",
  },
} as const;