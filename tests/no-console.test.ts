import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");

/**
 * Server-side modules must log through `createLogger` so lines are JSON and
 * secrets are redacted. `logger.ts` is the sink itself; it imports
 * `node:crypto`, so it cannot be shared with the client bundle.
 */
const ALLOWED = new Set([join("src", "lib", "logger.ts")]);

const CONSOLE_CALL = /\bconsole\s*\.\s*(log|error|warn|info|debug|trace)\s*\(/;

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      found.push(full);
    }
  }
  return found;
}

test("server modules log through the structured logger, not console", () => {
  const files = [
    ...walk(join(SRC, "lib")),
    ...walk(join(SRC, "app", "api")),
  ];

  const offenders = files
    .map((file) => relative(ROOT, file))
    .filter((file) => !ALLOWED.has(file))
    .filter((file) => CONSOLE_CALL.test(readFileSync(join(ROOT, file), "utf8")))
    .map((file) => file.split(sep).join("/"));

  assert.deepEqual(
    offenders,
    [],
    `these server modules still log with console.*: ${offenders.join(", ")}`
  );
});

test("the scan actually finds console usage where it is allowed", () => {
  // Guards against a regex typo silently passing the test above.
  const sink = readFileSync(join(SRC, "lib", "logger.ts"), "utf8");
  assert.ok(CONSOLE_CALL.test(sink));
});
