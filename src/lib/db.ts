import { Pool, QueryResultRow } from "pg";
import fs from "fs";

const isProduction = process.env.NODE_ENV === "production";

const connectionString =
  process.env.DATABASE_URL ||
  (isProduction ? undefined : "postgresql://postgres:postgres@localhost:5432/clash_soccer");

if (!connectionString) {
  throw new Error("FATAL: DATABASE_URL environment variable must be set in production!");
}

const sslConfig = connectionString.includes("sslmode=disable")
  ? false
  : isProduction
    ? {
        rejectUnauthorized: process.env.PG_REJECT_UNAUTHORIZED !== "false",
        ca: process.env.PG_CA_CERT ? fs.readFileSync(process.env.PG_CA_CERT).toString() : undefined,
      }
    : false;

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export async function query<T extends QueryResultRow>(text: string, params?: (string | number | boolean | null)[]) {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    if (!isProduction) {
      const duration = Date.now() - start;
      console.log("executed query", { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error("Error executing query", { text, params, error });
    throw error;
  }
}

export default pool;
