import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";

// --- Standard API Response Structures ---

interface SuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
  data: null;
}

export type ApiResponse<T> = NextResponse<SuccessResponse<T> | ErrorResponse>;

// --- Response Helper Functions ---

export function success<T>(data: T, status: number = 200): ApiResponse<T> {
  return NextResponse.json({ success: true, data, error: null }, { status });
}

export function created<T>(data: T): ApiResponse<T> {
  return success(data, 201);
}

export function error(
  message: string,
  status: number = 500,
  details?: unknown
): ApiResponse<never> {
  console.error(`API Error (${status}): ${message}`, details || "");
  return NextResponse.json(
    { success: false, error: { message, details }, data: null },
    { status }
  );
}

export function badRequest(
  message: string = "Invalid request",
  details?: unknown
): ApiResponse<never> {
  return error(message, 400, details);
}

export function unauthorized(
  message: string = "Unauthorized"
): ApiResponse<never> {
  return error(message, 401);
}

export function notFound(message: string = "Not found"): ApiResponse<never> {
  return error(message, 404);
}

export function conflict(
  message: string = "Conflict"
): ApiResponse<never> {
  return error(message, 409);
}

export function serverError(
  err: unknown,
  context: string = "An unexpected error occurred"
): ApiResponse<never> {
  // Log the actual error for debugging
  console.error(`[Server Error] Context: ${context}`, err);
  return error("Internal Server Error", 500);
}

// --- Middleware and Validation ---

export async function requireAdmin(request: Request): Promise<ApiResponse<never> | null> {
  const isAdmin = await isAdminRequest(request);
  if (isAdmin) {
    return null; // No error, proceed
  }
  return unauthorized();
}

export async function validate<T, U>(
  req: Request,
  schema: ZodSchema<T>,
  handler: (data: T) => Promise<ApiResponse<U>>
): Promise<ApiResponse<U | never>> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return await handler(data);
  } catch (e) {
    if (e instanceof ZodError) {
      return badRequest("Invalid input data", e.flatten().fieldErrors);
    }
    // Handle cases where req.json() fails (e.g., empty or malformed body)
    if (e instanceof SyntaxError) {
      return badRequest("Malformed JSON in request body");
    }
    return serverError(e, "Error during validation");
  }
}

// --- Type Guards and Parsers (Keeping the useful ones) ---

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function toPositiveInteger(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function toNonNegativeInteger(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

export function isValidDateString(value: unknown): value is string {
  return isNonEmptyString(value) && !isNaN(Date.parse(value));
}

export function isValidTimeString(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  const timeRegex = /^\d{2}:\d{2}$/;
  return timeRegex.test(value);
}
