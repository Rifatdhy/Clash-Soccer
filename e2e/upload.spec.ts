import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PNG = readFileSync(join(__dirname, "fixtures", "pixel.png"));

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#admin-username").fill(process.env.ADMIN_USERNAME ?? "admin");
  await page.locator("#admin-password").fill(process.env.ADMIN_PASSWORD ?? "e2e-password-123");
  await page.getByRole("button", { name: /masuk/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login");
}

test("anonymous uploads are rejected", async ({ request }) => {
  const response = await request.post("/api/uploads", {
    multipart: { file: { name: "pixel.png", mimeType: "image/png", buffer: PNG } },
  });

  expect(response.status()).toBe(401);
});

test("an uploaded image is stored and served back from the app", async ({ page }) => {
  await login(page);

  const upload = await page.context().request.post("/api/uploads", {
    multipart: { file: { name: "pixel.png", mimeType: "image/png", buffer: PNG } },
  });

  expect(upload.status()).toBe(201);
  const body = (await upload.json()) as { data?: { url?: string } };
  const url = body.data?.url;
  expect(url).toMatch(/^\/api\/uploads\/[0-9a-f-]+\.png$/);

  const fetched = await page.context().request.get(url as string);
  expect(fetched.status()).toBe(200);
  expect(fetched.headers()["content-type"]).toContain("image/png");
  expect((await fetched.body()).length).toBe(PNG.length);
});

test("non-image uploads are rejected", async ({ page }) => {
  await login(page);

  const response = await page.context().request.post("/api/uploads", {
    multipart: {
      file: { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
    },
  });

  expect(response.status()).toBe(400);
});
