/**
 * Formatting utilities
 * Centralized date, time, and text formatting functions
 */

/**
 * Parse a DB date (`YYYY-MM-DD`) without letting the timezone move the day.
 * Only call this with an exact date-only string; ISO datetimes carry their own
 * offset and must go through `new Date`.
 */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date string to Indonesian locale
 * @example formatDate("2026-07-20") → "20 Jul 2026"
 */
export function formatDate(dateStr: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? parseDateOnly(dateStr)
    : new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format time string (24h) to display format
 * @example formatTime("19:00") → "19:00 WIB"
 */
export function formatTime(timeStr: string): string {
  return `${timeStr} WIB`;
}

/**
 * Generate URL-safe slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}