import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { createLogger, reportError, resolveRequestId } from "@/lib/logger";

const logger = createLogger();

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
  details?: unknown,
  requestId?: string
): ApiResponse<never> {
  logger.error(message, { status, details, ...(requestId ? { requestId } : {}) });
  const response = NextResponse.json<ErrorResponse>(
    { success: false, error: { message, details }, data: null },
    { status }
  );
  if (requestId) response.headers.set("x-request-id", requestId);
  return response;
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

export function tooManyRequests(
  message: string = "Too many requests. Please try again later.",
  details?: unknown
): ApiResponse<never> {
  return error(message, 429, details);
}

export function payloadTooLarge(
  message: string = "Request body is too large"
): ApiResponse<never> {
  return error(message, 413);
}

export function serverError(
  err: unknown,
  context: string = "An unexpected error occurred",
  requestId?: string
): ApiResponse<never> {
  reportError(err, { context, ...(requestId ? { requestId } : {}) });
  return error("Internal Server Error", 500, undefined, requestId);
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
  const requestId = resolveRequestId(req);
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
    return serverError(e, "Error during validation", requestId);
  }
}
