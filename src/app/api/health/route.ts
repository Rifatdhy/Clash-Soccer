import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const startedAt = Date.now();

  try {
    await query("SELECT 1");

    return NextResponse.json({
      status: "ok",
      database: "ok",
      uptime: process.uptime(),
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "error",
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}