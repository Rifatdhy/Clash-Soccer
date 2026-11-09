import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#admin-username").fill(process.env.ADMIN_USERNAME ?? "admin");
  await page.locator("#admin-password").fill(process.env.ADMIN_PASSWORD ?? "e2e-password-123");
  await page.getByRole("button", { name: /masuk/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login");
}

test("the health endpoint reports a healthy database", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  const body = (await response.json()) as Record<string, unknown>;
  expect(body.status).toBe("ok");
  expect(body.database).toBe("ok");
});

test("db-init requires an admin session", async ({ request }) => {
  const response = await request.get("/api/db-init");
  expect(response.status()).toBe(401);
});

test("db-init reports the applied migration set to an admin", async ({ page }) => {
  await login(page);

  const response = await page.context().request.get("/api/db-init");
  expect(response.status()).toBe(200);

  const body = (await response.json()) as { success?: boolean; applied?: string[] };
  expect(body.success).toBe(true);
  expect(Array.isArray(body.applied)).toBe(true);
});
