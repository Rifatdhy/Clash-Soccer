import { cookies } from "next/headers";
import { STORAGE_KEYS } from "./constants.ts";
import { verifyAdminSessionToken } from "./admin-session.ts";

// Kept here so every existing import site keeps working. `admin-session.ts`
// holds the JWT logic and has no `next/headers` dependency, which is what makes
// it testable with the plain Node test runner.
export { createAdminSessionToken, verifyAdminSessionToken } from "./admin-session.ts";

/**
 * Admin check for a route handler.
 *
 * The cookie is read through `cookies()` because the session lives in an
 * httpOnly cookie that the proxy already validated. The request argument is
 * accepted only for call-site symmetry; it is not consulted.
 */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STORAGE_KEYS.ADMIN_AUTH_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}
