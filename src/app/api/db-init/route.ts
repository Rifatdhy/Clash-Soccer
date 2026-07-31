import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db-init";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: Request) {
  // Disable DB initialization via HTTP in production for safety
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Database initialization via HTTP is disabled in production." },
      { status: 403 }
    );
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    await initDatabase();
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    });
  } catch (error) {
    console.error("DB Init Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: "Failed to initialize database", details: errorMessage },
      { status: 500 }
    );
  }
}
