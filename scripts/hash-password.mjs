import { hashPassword } from "../src/lib/password.ts";

// Prefer the environment so the password does not land in shell history.
const password = process.env.ADMIN_PASSWORD ?? process.argv[2];

if (!password) {
  console.error("Usage: ADMIN_PASSWORD=<password> node scripts/hash-password.mjs");
  console.error("   or: node scripts/hash-password.mjs <password> (visible in history)");
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
