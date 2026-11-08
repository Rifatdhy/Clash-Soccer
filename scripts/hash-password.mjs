import { hashPassword } from "../src/lib/password.ts";

const password = process.argv[2] ?? process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  console.error("   or: ADMIN_PASSWORD=<password> node scripts/hash-password.mjs");
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
