import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { formatEnvIssues, validateEnv } from "@/lib/env";

export async function GET() {
  const startedAt = Date.now();
  const configIssues = formatEnvIssues(
    validateEnv(process.env, process.env.NODE_ENV === "production")
  );

  try {
    await query("SELECT 1");

    return NextResponse.json(
      {
        status: configIssues.length > 0 ? "degraded" : "ok",
        database: "ok",
        config: configIssues.length > 0 ? "degraded" : "ok",
        issues: configIssues,
        uptime: process.uptime(),
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: configIssues.length > 0 ? 503 : 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "error",
        config: configIssues.length > 0 ? "degraded" : "ok",
        issues: configIssues,
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}