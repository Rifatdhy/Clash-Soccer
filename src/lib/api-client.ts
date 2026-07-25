/**
 * Shared API client utilities
 * Centralized HTTP request handling with consistent error handling
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  queryParams?: string;
}

/**
 * Make an API request with consistent error handling
 */
export async function apiRequest<T = any>(
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

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }

  return response.json();
}

/**
 * Wrapper functions for common HTTP methods
 */
export const api = {
  get: <T = any>(endpoint: string, queryParams?: string) =>
    apiRequest<T>(endpoint, { method: "GET", queryParams }),

  post: <T = any>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, { method: "POST", body }),

  put: <T = any>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, { method: "PUT", body }),

  delete: <T = any>(endpoint: string, queryParams?: string) =>
    apiRequest<T>(endpoint, { method: "DELETE", queryParams }),
};

/**
 * Safe API call with fallback
 * Returns fallback value if request fails
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (errorMessage) {
      console.error(errorMessage, error);
    }
    return fallback;
  }
}