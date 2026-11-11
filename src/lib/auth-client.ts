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
