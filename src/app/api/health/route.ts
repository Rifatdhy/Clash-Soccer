import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { formatEnvIssues, validateEnv } from "@/lib/env";
import { describeHealth } from "@/lib/health";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "/api/health" });

export async function GET() {
  const startedAt = Date.now();
  const configIssues = formatEnvIssues(
    validateEnv(process.env, process.env.NODE_ENV === "production")
  );

  let databaseOk = true;
  try {
    await query("SELECT 1");
  } catch (error) {
    databaseOk = false;
    logger.error("Health check database probe failed", { error });
  }

  const health = describeHealth({ databaseOk, configIssues });

  return NextResponse.json(
    {
      status: health.status,
      database: health.database,
      config: health.config,
      issues: configIssues,
      uptime: process.uptime(),
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: health.httpStatus }
  );
}
