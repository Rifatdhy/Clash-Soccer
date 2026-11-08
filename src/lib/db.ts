import { Pool } from "pg";
import type { PoolClient, QueryResultRow } from "pg";
import fs from "fs";
import { assertEnv } from "./env.ts";

const isProduction = process.env.NODE_ENV === "production";

if (process.env.NEXT_PHASE !== "phase-production-build") {
  assertEnv();
}

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
  // A broken idle client is not fatal: the pool discards it. Exiting here
  // would turn a database blip into a full outage.
  console.error("Unexpected error on idle client", err);
});

export async function query<T extends QueryResultRow>(text: string, params?: unknown[]) {
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

/**
 * Run several statements on one connection. `pool.query` hands the client
 * back after every call, so BEGIN/COMMIT through it is not a transaction.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Failed to roll back transaction", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
