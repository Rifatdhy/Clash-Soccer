const encoder = new TextEncoder();

export const ADMIN_AUTH_COOKIE = "clash_admin_session";

function getAuthSecret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_PASSWORD || "change_this_password";
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signAdminPayload(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return bytesToHex(signature);
}

export async function createAdminSessionToken(username: string) {
  const issuedAt = Date.now().toString();
  const payload = `${username}.${issuedAt}`;
  const signature = await signAdminPayload(payload);

  return `${payload}.${signature}`;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export async function verifyAdminSessionToken(token?: string) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [username, issuedAt, signature] = parts;
  if (!username || !issuedAt || !signature) return false;

  const issuedAtNumber = Number(issuedAt);
  if (!Number.isFinite(issuedAtNumber)) return false;

  const maxAgeMs = 1000 * 60 * 60 * 24;
  if (Date.now() - issuedAtNumber > maxAgeMs) return false;

  const expectedSignature = await signAdminPayload(`${username}.${issuedAt}`);

  return timingSafeEqual(signature, expectedSignature);
}

export async function isAdminRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${ADMIN_AUTH_COOKIE}=`))
    ?.split("=")[1];

  return verifyAdminSessionToken(token ? decodeURIComponent(token) : undefined);
}
