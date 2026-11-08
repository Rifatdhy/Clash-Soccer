import { randomUUID } from "node:crypto";

const SECRET_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "cookie",
  "secret",
  "api_key",
  "apikey",
]);

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SECRET_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redact(nested);
    }
    return result;
  }

  return value;
}

type LogContext = Record<string, unknown>;
type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, base: LogContext, message: string, context?: LogContext) {
  const payload = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...(redact({ ...base, ...context }) as Record<string, unknown>),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(base: LogContext = {}) {
  return {
    info: (message: string, context?: LogContext) => write("info", base, message, context),
    warn: (message: string, context?: LogContext) => write("warn", base, message, context),
    error: (message: string, context?: LogContext) => write("error", base, message, context),
  };
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id")?.trim() || randomUUID();
}

function sendToSentry(error: unknown, context: LogContext): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, "");
    const publicKey = url.username;
    if (!projectId || !publicKey) return;

    const eventId = randomUUID().replace(/-/g, "");
    const endpoint = `${url.origin}/api/${projectId}/envelope/`;
    const sentAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : String(error);

    const envelope = [
      JSON.stringify({ event_id: eventId, sent_at: sentAt }),
      JSON.stringify({ type: "event", content_type: "application/json" }),
      JSON.stringify({
        event_id: eventId,
        timestamp: sentAt,
        level: "error",
        platform: "node",
        message,
        extra: redact(context),
      }),
    ].join("\n");

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=clash-soccer/1.0`,
      },
      body: envelope,
      signal: AbortSignal.timeout(2000),
    }).catch(() => {});
  } catch {
    // Observability must never break the request path.
  }
}

export function reportError(error: unknown, context: LogContext = {}): void {
  createLogger(context).error(
    "Unhandled error",
    error instanceof Error
      ? { error: { name: error.name, message: error.message, stack: error.stack } }
      : { error }
  );
  sendToSentry(error, context);
}
