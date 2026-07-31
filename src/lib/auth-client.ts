import { STORAGE_KEYS } from "./constants";

export async function isAuthenticated(): Promise<boolean> {
  const response = await fetch('/api/auth/status');
  if (!response.ok) {
    return false;
  }
  const data = await response.json();
  return data.isAuthenticated === true;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
  // Also delete the cookie on the client side
  document.cookie = `${STORAGE_KEYS.ADMIN_AUTH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    return { success: true };
  }

  try {
    const data = await response.json();
    return { success: false, error: data.error?.message || 'Login failed' };
  } catch {
    return { success: false, error: 'Login failed' };
  }
}
