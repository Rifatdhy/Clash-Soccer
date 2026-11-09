import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db-init";
import { requireAdmin } from "@/lib/api-helpers";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "/api/db-init" });

export async function GET(req: Request) {
  // Migrations over HTTP are a development convenience only. In production
  // they run from the deploy pipeline (`npm run db:migrate`), where the
  // advisory lock and console output are available.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Database initialization via HTTP is disabled in production." },
      { status: 403 }
    );
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { applied } = await initDatabase();
    return NextResponse.json({
      success: true,
      message:
        applied.length === 0
          ? "Database is up to date"
          : `Applied ${applied.length} migration(s)`,
      applied,
    });
  } catch (error) {
    logger.error("DB init failed", { error });
    return NextResponse.json(
      { success: false, error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}
