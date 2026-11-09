import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { STORAGE_KEYS } from "./constants";
import { createLogger } from "./logger";

const logger = createLogger({ service: "admin-auth" });

const JWT_AUDIENCE = "clash-soccer:admin";
const JWT_ISSUER = "clash-soccer:auth";
const JWT_EXPIRATION = "24h";

function getAuthSecretKey() {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: ADMIN_AUTH_SECRET environment variable must be set in production!");
    }
    logger.warn(
      "ADMIN_AUTH_SECRET is not set; using the development fallback key. Never deploy like this."
    );
    return new TextEncoder().encode("clash-soccer-default-secret-key-change-me-in-production-12345678");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(username: string) {
  const secretKey = getAuthSecretKey();
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secretKey);

  return token;
}

export async function verifyAdminSessionToken(token?: string) {
  if (!token) return false;

  const adminUsername = process.env.ADMIN_USERNAME;
  if (!adminUsername || adminUsername.trim() === "") {
    logger.error("ADMIN_USERNAME is not configured; every admin session is rejected");
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecretKey(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload.username === adminUsername;
  } catch {
    // Token verification failed (expired, invalid signature, etc.)
    return false;
  }
}

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
