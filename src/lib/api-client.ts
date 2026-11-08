/**
 * Shared API client utilities
 * Centralized HTTP request handling with consistent error handling
 */

// --- Custom Error for API Failures ---
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- Standard API Response Shape from Backend ---
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
  };
}

// --- Request Configuration ---
interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  queryParams?: string;
}

/**
 * Make an API request with consistent error handling.
 * Parses the standard API response format.
 * @returns The `data` property of the response if successful.
 * @throws {ApiError} if the request fails or the API returns an error.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions
): Promise<T> {
  const { method, body, queryParams = "" } = options;
  const url = `${endpoint}${queryParams}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let responseData: ApiResponse<T>;
  try {
    responseData = await response.json();
  } catch {
    // Handle cases where the response is not valid JSON
    throw new ApiError(
      `Invalid JSON response from server (status: ${response.status})`,
      response.status
    );
  }

  if (!response.ok || !responseData.success) {
    const errorMessage = responseData.error?.message || `API Error: ${response.status}`;
    throw new ApiError(errorMessage, response.status, responseData.error?.details);
  }

  // We can be sure data exists on success
  return responseData.data as T;
}

/**
 * Wrapper functions for common HTTP methods
 */
export const api = {
  get: <T>(endpoint: string, queryParams?: string) =>
    apiRequest<T>(endpoint, { method: "GET", queryParams }),

  post: <T>(endpoint:string, body: RequestOptions['body']) =>
    apiRequest<T>(endpoint, { method: "POST", body }),

  put: <T>(endpoint: string, body: RequestOptions['body']) =>
    apiRequest<T>(endpoint, { method: "PUT", body }),

  delete: <T>(endpoint: string, queryParams?: string) =>
    apiRequest<T>(endpoint, { method: "DELETE", queryParams }),
};