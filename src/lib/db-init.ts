import { query } from "./db";
import fs from "fs";
import path from "path";

export async function initDatabase() {
  try {
    console.log("Initializing database schema...");
    const schemaPath = path.join(process.cwd(), "src/lib/schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");

    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await query(stmt);
    }
    console.log("Database schema initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    throw err;
  }
}
