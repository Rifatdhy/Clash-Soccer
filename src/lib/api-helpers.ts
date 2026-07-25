import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message = "Invalid request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(error: unknown, context: string) {
  console.error(context, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function requireAdmin(request: Request) {
  if (await isAdminRequest(request)) return null;
  return unauthorized();
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00`))
  );
}

export function isValidTimeString(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function toPositiveInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function toNonNegativeInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}