/**
 * Health-check classification.
 *
 * The route used to report `degraded` only when the database answered while
 * production config was incomplete — but `assertEnv` throws on startup in that
 * case, so the branch was unreachable and a config problem could never be seen
 * in the health output. Keeping the decision here makes it testable.
 */

export type HealthStatus = "ok" | "degraded" | "error";
export type HealthComponent = "ok" | "degraded" | "error";

export interface HealthInput {
  databaseOk: boolean;
  configIssues: string[];
}

export interface HealthResult {
  status: HealthStatus;
  database: HealthComponent;
  config: HealthComponent;
  httpStatus: 200 | 503;
}

export function publicHealth(result: HealthResult): { status: HealthStatus } {
  return { status: result.status };
}

export function describeHealth({ databaseOk, configIssues }: HealthInput): HealthResult {
  const config: HealthComponent = configIssues.length > 0 ? "degraded" : "ok";
  const database: HealthComponent = databaseOk ? "ok" : "error";

  const status: HealthStatus = !databaseOk ? "error" : config === "degraded" ? "degraded" : "ok";

  return {
    status,
    database,
    config,
    httpStatus: status === "ok" ? 200 : 503,
  };
}
