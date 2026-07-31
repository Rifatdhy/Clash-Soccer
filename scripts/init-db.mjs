import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("FATAL: DATABASE_URL environment variable must be set.");
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";
const ssl = connectionString.includes("sslmode=disable")
  ? false
  : isProduction
    ? { rejectUnauthorized: process.env.PG_REJECT_UNAUTHORIZED !== "false" }
    : false;

const client = new pg.Client({ connectionString, ssl });
const sql = readFileSync(join(__dirname, "../src/lib/schema.sql"), "utf8");

await client.connect();
const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
for (const stmt of statements) {
  await client.query(stmt);
}
await client.end();
console.log("Database schema initialized successfully.");
