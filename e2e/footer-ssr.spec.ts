import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#admin-username").fill(process.env.ADMIN_USERNAME ?? "admin");
  await page.locator("#admin-password").fill(process.env.ADMIN_PASSWORD ?? "e2e-password-123");
  await page.getByRole("button", { name: /masuk/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login");
}

test("a settings update is visible on the next server render", async ({ page, request }) => {
  await login(page);

  const original = await page.context().request.get("/api/settings");
  const originalBody = (await original.json()) as { data: Record<string, unknown> };
  const marker = `E2E-FOOTER-${Date.now()}`;

  const update = await page.context().request.put("/api/settings", {
    data: { description: marker },
  });
  expect(update.status()).toBe(200);

  try {
    const readBack = await page.context().request.get("/api/settings");
    const readBackBody = (await readBack.json()) as { data: { description: string } };
    expect(readBackBody.data.description).toBe(marker);

    const html = await (await request.get("/")).text();
    expect(html).toContain(marker);
  } finally {
    await page.context().request.put("/api/settings", {
      data: { description: originalBody.data.description },
    });
  }
});
