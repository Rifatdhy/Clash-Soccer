import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/", heading: /less talk/i },
  { path: "/schedule", heading: /^schedule$/i },
  { path: "/news", heading: /^news$/i },
  { path: "/gallery", heading: /^gallery$/i },
  { path: "/faq", heading: /^faq$/i },
  { path: "/about", heading: /^about$/i },
  { path: "/contact", heading: /^contact$/i },
];

for (const { path, heading } of PUBLIC_PAGES) {
  test(`public page ${path} renders its heading in the server HTML`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto(path, { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
}

test("primary navigation reaches the schedule page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /schedule|jadwal/i }).first().click();
  await expect(page).toHaveURL(/\/schedule$/);
  await expect(page.getByRole("heading", { level: 1, name: /^schedule$/i })).toBeVisible();
});

test("a Drive album still opens its detail page and links out to Drive", async ({ page }) => {
  await page.goto("/gallery");

  const driveCard = page.getByRole("link").filter({ hasText: /Google Drive/i }).first();
  await expect(driveCard).toBeVisible();
  await driveCard.click();

  await expect(page).toHaveURL(/\/gallery\/[^/]+$/);

  const openDrive = page.getByRole("link", { name: /Buka Google Drive/i });
  await expect(openDrive).toBeVisible();
  await expect(openDrive).toHaveAttribute("href", /^https:\/\/drive\.google\.com\//);
});
