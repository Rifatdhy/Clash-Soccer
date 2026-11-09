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

test("an oversized upload is refused instead of buffered", async ({ page }) => {
  await login(page);

  // Bigger than the 5 MB file cap; the server must reject it from the
  // declared body size rather than reading it into memory first.
  const oversized = Buffer.alloc(6 * 1024 * 1024, 1);
  const response = await page.context().request.post("/api/uploads", {
    multipart: {
      file: { name: "big.png", mimeType: "image/png", buffer: oversized },
    },
  });

  expect(response.status()).toBe(413);
});

test("deleting a news item removes the upload only it used", async ({ page }) => {
  await login(page);

  const upload = await page.context().request.post("/api/uploads", {
    multipart: { file: { name: "pixel.png", mimeType: "image/png", buffer: PNG } },
  });
  expect(upload.status()).toBe(201);
  const url = ((await upload.json()) as { data: { url: string } }).data.url;

  const id = `e2e-news-${Date.now()}`;
  const created = await page.context().request.post("/api/news", {
    data: {
      id,
      title: "E2E cleanup",
      slug: `e2e-cleanup-${Date.now()}`,
      content: "Body",
      excerpt: "Excerpt",
      coverImage: url,
      date: "2026-01-01",
    },
  });
  expect(created.status()).toBe(201);

  const removed = await page.context().request.delete(`/api/news?id=${id}`);
  expect(removed.status()).toBe(200);

  const fetched = await page.context().request.get(url);
  expect(fetched.status()).toBe(404);
});

test("replacing a news cover removes the previous upload", async ({ page }) => {
  await login(page);

  async function uploadOnce() {
    const response = await page.context().request.post("/api/uploads", {
      multipart: { file: { name: "pixel.png", mimeType: "image/png", buffer: PNG } },
    });
    expect(response.status()).toBe(201);
    return ((await response.json()) as { data: { url: string } }).data.url;
  }

  const first = await uploadOnce();
  const second = await uploadOnce();

  const id = `e2e-replace-${Date.now()}`;
  const created = await page.context().request.post("/api/news", {
    data: {
      id,
      title: "E2E replace",
      slug: `e2e-replace-${Date.now()}`,
      content: "Body",
      excerpt: "Excerpt",
      coverImage: first,
      date: "2026-01-01",
    },
  });
  expect(created.status()).toBe(201);

  try {
    const updated = await page.context().request.put("/api/news", {
      data: { id, coverImage: second },
    });
    expect(updated.status()).toBe(200);

    expect((await page.context().request.get(first)).status()).toBe(404);
    expect((await page.context().request.get(second)).status()).toBe(200);
  } finally {
    await page.context().request.delete(`/api/news?id=${id}`);
  }
});
