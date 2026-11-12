/**
 * Slot arithmetic shared by the RSVP API and the admin match form.
 * Pure functions so the rules can be tested without a database.
 */

export function canReserve(slotsAvailable: number, requested: number): boolean {
  return Number.isInteger(requested) && requested > 0 && requested <= slotsAvailable;
}

/**
 * When an admin edits a match, registrations already taken must be preserved.
 * Returns the availability the match should have after the total changes.
 */
export function availableAfterTotalChange(
  slotsTotal: number,
  slotsAvailable: number,
  newTotal: number
): number {
  const registered = Math.max(0, slotsTotal - slotsAvailable);
  return Math.max(0, newTotal - registered);
}

/** Give slots back when an RSVP is deleted, never above the total. */
export function restoreSlots(
  slotsTotal: number,
  slotsAvailable: number,
  released: number
): number {
  return Math.min(slotsTotal, slotsAvailable + Math.max(0, released));
}

/**
 * Availability must be a whole number inside `[0, total]`. The database has the
 * same rule as a CHECK constraint, so a write that skips this helper still
 * cannot persist an impossible match.
 */
export function slotsWithinLimits(total: number, available: number): boolean {
  return Number.isInteger(available) && available >= 0 && available <= total;
}
