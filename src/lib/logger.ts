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

/**
 * Keys whose values are personal contact data rather than secrets. The RSVP
 * route echoes duplicate WhatsApp numbers in its 400 body and every 4xx body
 * is logged, so without this the log keeps real phone numbers forever.
 */
const PII_KEYS = new Set([
  "whatsapp",
  "phone",
  "telephone",
  "mobile",
  "email",
  "duplicates",
]);

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const lowered = key.toLowerCase();
      if (SECRET_KEYS.has(lowered) || PII_KEYS.has(lowered)) {
        result[key] = "[REDACTED]";
        continue;
      }
      result[key] = redact(nested);
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

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

/**
 * Request id used for log correlation. An inbound `x-request-id` is kept only
 * when it looks like an id: anything with whitespace or an unreasonable
 * length is replaced so a crafted header cannot forge or split log lines.
 */
export function resolveRequestId(request: Request): string {
  const inbound = request.headers.get("x-request-id")?.trim();
  if (inbound && SAFE_REQUEST_ID.test(inbound)) return inbound;
  return randomUUID();
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
