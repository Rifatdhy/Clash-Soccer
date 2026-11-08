import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `${HASH_PREFIX}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;

  if (!stored.startsWith(`${HASH_PREFIX}$`)) {
    return safeEqual(password, stored);
  }

  const parts = stored.split("$");
  if (parts.length !== 3) return false;

  const [, saltPart, hashPart] = parts;
  try {
    const salt = Buffer.from(saltPart, "base64");
    const expected = Buffer.from(hashPart, "base64");
    if (salt.length === 0 || expected.length !== KEY_LENGTH) return false;

    const derived = scryptSync(password, salt, KEY_LENGTH);
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
