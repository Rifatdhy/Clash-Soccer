import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#admin-username").fill(process.env.ADMIN_USERNAME ?? "admin");
  await page.locator("#admin-password").fill(process.env.ADMIN_PASSWORD ?? "e2e-password-123");
  await page.getByRole("button", { name: /masuk/i }).click();
  await page.waitForURL(
    (url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login"
  );
}

test("Add FAQ creates one row without a 400", async ({ page }) => {
  await login(page);
  await page.goto("/admin/settings");

  await page.getByRole("button", { name: /add faq/i }).click();
  const question = page.getByPlaceholder("Question").last();
  const answer = page.getByPlaceholder("Answer").last();

  await question.fill("Jam berapa latihan?");
  await answer.fill("Setiap Rabu pukul 19.00 WIB.");
  await answer.blur();

  await expect(page.getByText(/Gagal menambah FAQ/)).toHaveCount(0);

  await page.reload();
  await expect
    .poll(async () =>
      page.getByPlaceholder("Question").evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value)
      )
    )
    .toContain("Jam berapa latihan?");
});

test("a draft FAQ deleted before it is complete never reaches the API", async ({ page }) => {
  await login(page);
  await page.goto("/admin/settings");

  await page.getByRole("button", { name: /add faq/i }).click();
  await page.getByPlaceholder("Question").last().fill("Draft yang tidak jadi");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /hapus faq/i }).last().click();

  await expect(page.getByText(/Gagal menghapus FAQ/)).toHaveCount(0);
  await page.reload();
  await expect
    .poll(async () =>
      page.getByPlaceholder("Question").evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value)
      )
    )
    .not.toContain("Draft yang tidak jadi");
});
