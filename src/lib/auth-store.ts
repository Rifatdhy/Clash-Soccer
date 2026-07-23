const AUTH_KEY = "clash-soccer-auth";

const ADMIN_USERNAME = "rifat";
const ADMIN_PASSWORD = "123";

export function login(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_KEY, "true");
    }
    return true;
  }
  return false;
}

export function logout() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AUTH_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}
