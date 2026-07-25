const AUTH_KEY = "clash-soccer-auth";

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_KEY, "true");
        sessionStorage.setItem("adminUsername", data.user.username);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
}

export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem("adminUsername");
    }
  }
}

export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const response = await fetch("/api/auth/status", { cache: "no-store" });
    const data = await response.json();

    if (data.authenticated) {
      sessionStorage.setItem(AUTH_KEY, "true");
      return true;
    }

    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem("adminUsername");
    return false;
  } catch (error) {
    console.error("Auth status error:", error);
    return sessionStorage.getItem(AUTH_KEY) === "true";
  }
}
