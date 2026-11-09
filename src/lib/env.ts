import { createLogger } from "./logger.ts";

const logger = createLogger({ service: "env" });

export type EnvIssueKind = "missing" | "weak" | "invalid";

export interface EnvIssue {
  key: string;
  kind: EnvIssueKind;
  message: string;
}

const REQUIRED_KEYS = ["DATABASE_URL", "ADMIN_USERNAME", "SITE_URL"] as const;
const MIN_SECRET_LENGTH = 32;

function present(value: string | undefined): value is string {
  return Boolean(value && value.trim());
}

export function validateEnv(
  env: Record<string, string | undefined>,
  isProduction: boolean
): EnvIssue[] {
  if (!isProduction) return [];

  const issues: EnvIssue[] = [];

  for (const key of REQUIRED_KEYS) {
    if (!present(env[key])) {
      issues.push({ key, kind: "missing", message: `${key} is required in production.` });
    }
  }

  if (!present(env.ADMIN_AUTH_SECRET)) {
    issues.push({
      key: "ADMIN_AUTH_SECRET",
      kind: "missing",
      message: "ADMIN_AUTH_SECRET is required in production.",
    });
  } else if (env.ADMIN_AUTH_SECRET.trim().length < MIN_SECRET_LENGTH) {
    issues.push({
      key: "ADMIN_AUTH_SECRET",
      kind: "weak",
      message: `ADMIN_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`,
    });
  }

  if (!present(env.ADMIN_PASSWORD_HASH) && !present(env.ADMIN_PASSWORD)) {
    issues.push({
      key: "ADMIN_PASSWORD",
      kind: "missing",
      message: "Set ADMIN_PASSWORD_HASH (preferred) or ADMIN_PASSWORD.",
    });
  }

  if (present(env.SITE_URL)) {
    try {
      const url = new URL(env.SITE_URL);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("unsupported protocol");
      }
    } catch {
      issues.push({
        key: "SITE_URL",
        kind: "invalid",
        message: "SITE_URL must be a valid http(s) URL.",
      });
    }
  }

  return issues;
}

export function formatEnvIssues(issues: EnvIssue[]): string[] {
  return issues.map((issue) => `${issue.key}: ${issue.message}`);
}

export function assertEnv(env: Record<string, string | undefined> = process.env): void {
  const issues = validateEnv(env, env.NODE_ENV === "production");
  if (issues.length === 0) return;

  const message = `Invalid environment configuration:\n${formatEnvIssues(issues).join("\n")}`;
  if (env.NODE_ENV === "production") {
    throw new Error(message);
  }
  logger.warn("Invalid environment configuration", { issues: formatEnvIssues(issues) });
}
