import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#admin-username").fill(process.env.ADMIN_USERNAME ?? "admin");
  await page.locator("#admin-password").fill(process.env.ADMIN_PASSWORD ?? "e2e-password-123");
  await page.getByRole("button", { name: /masuk/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login");
}

test("admin login rejects a wrong password without leaving the login page", async ({ page }) => {
  await page.goto("/admin/login");
  await page.locator("#admin-username").fill("admin");
  await page.locator("#admin-password").fill("definitely-wrong-password");
  await page.getByRole("button", { name: /masuk/i }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("add match modal closes on Escape and returns focus to its trigger", async ({ page }) => {
  await login(page);
  await page.goto("/admin/matches");

  const trigger = page.getByRole("button", { name: /add match/i });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("#match-modal-title")).toHaveText(/add match/i);
  await expect(dialog.getByRole("button", { name: /tutup form match/i })).toBeFocused();

  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
