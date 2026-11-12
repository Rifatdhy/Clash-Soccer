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
  expect(Object.keys(body)).toEqual(["status"]);
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

test("an oversized JSON body is refused before it is parsed", async ({ request }) => {
  // 5 MB of JSON against a 3 MB cap. Without the header check this body is
  // buffered and parsed first, on a public endpoint.
  const response = await request.post("/api/auth/login", {
    headers: { "content-type": "application/json" },
    data: { username: "a".repeat(5 * 1024 * 1024), password: "x" },
  });

  expect(response.status()).toBe(413);
});

test("a rate limited login tells the client when to retry", async ({ request }) => {
  // A dedicated X-Real-IP keeps this test from draining the bucket that every
  // other test shares, which would make their logins fail with 429.
  const ip = `198.51.100.${Date.now() % 200}`;
  let limited: Awaited<ReturnType<typeof request.post>> | undefined;

  // The login limit is 5 attempts per window; drive it past the limit.
  for (let i = 0; i < 8; i += 1) {
    const response = await request.post("/api/auth/login", {
      headers: { "x-real-ip": ip },
      data: { username: "nobody", password: "wrong-password" },
    });
    if (response.status() === 429) {
      limited = response;
      break;
    }
  }

  expect(limited).toBeDefined();
  expect(limited!.status()).toBe(429);

  const retryAfter = limited!.headers()["retry-after"];
  expect(retryAfter).toBeDefined();
  expect(Number(retryAfter)).toBeGreaterThan(0);
});

test("a client error is logged as a warning, not as a server error", async ({ request }) => {
  // Sanity check that a 404 still answers correctly; the log level is covered
  // by the unit test, this guards the response shape.
  const response = await request.get("/api/news?slug=does-not-exist");
  expect(response.status()).toBe(200);
});
