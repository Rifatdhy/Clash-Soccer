# Clash.Soccer Audit Follow-up Plan

> **For agentic workers:** Use `executing-plans` or `subagent-driven-development`, one task at a time. Steps use `- [ ]` checkboxes. Jangan mencentang langkah yang tidak dijalankan.

**Goal:** Menutup 11 temuan audit repo 2026-11-11 dan menyinkronkan dokumentasi yang menyesatkan, tanpa mengubah struktur App Router, envelope API, atau alur bisnis utama.

**Architecture:** Pertahankan Next.js App Router. Perbaikan ditaruh sedekat mungkin dengan sumber masalah: aturan murni masuk ke `src/lib/*` dan diuji lebih dulu, lalu route/komponen memakainya. Integritas data dijaga di dua lapis (validasi aplikasi + constraint database). Perubahan dokumentasi hanya menyatakan perilaku yang benar-benar ada di kode.

**Tech Stack:** Next.js 16.2, React 19, TypeScript 5, PostgreSQL (`pg`), Zod 4, Node 24 `node --test`, Playwright.

**Spec/Audit:** laporan audit repo 2026-11-11 (11 temuan) di sesi ini. Dokumen desain lama bukan sumber kebenaran; kode dan test adalah sumber kebenaran.

**Baseline:** HEAD `a97483d`, working tree bersih. Baseline yang harus dicatat sebelum Task 1: `npm test` 204 lulus, `npm run lint` bersih, `npx tsc --noEmit` bersih, `npm run build` sukses tanpa database.

## Peta Temuan → Task

| # | Temuan | Severity | Task |
| --- | --- | --- | --- |
| 1 | `X-Real-IP` palsu melewati rate limit login | Must | 1 |
| 2 | `slotsAvailable` bisa melebihi `slotsTotal` | Must | 3 |
| 3 | Tombol Add FAQ selalu 400 | Must | 5 |
| 4 | Video galeri tidak bisa diputar | Must | 6 |
| 5 | Kolom DATE terkirim sebagai ISO timestamp | Should | 2 |
| 6 | `Date.parse` menerima tanggal mustahil/format bebas | Should | 2 |
| 7 | RSVP diterima untuk match `completed`/`ongoing` | Should | 4 |
| 8 | Fallback data URL 2 MB diam-diam masuk database | Should | 7 |
| 9 | Album bergdriveLink tidak bisa dibuka detail | Should | 6 |
| 10 | `sharp` tanpa batas piksel eksplisit | Should | 7 |
| 11 | `formatDateFull`/`formatRelativeTime` dead code | Nice | 8 |
| — | Kontradiksi dokumentasi (README, spec, status plan) | Should | 9, 10 |

## Global Constraints

- Jangan mengubah kontrak respons API: selalu `{ success, data, error }` lewat helper `src/lib/api-helpers.ts`.
- Jangan menambah dependency runtime. Test memakai `node --test`; E2E memakai Playwright yang sudah ada.
- Semua logika murni baru wajib punya test yang gagal sebelum implementasi.
- Setelah setiap task: `npm test`, `npx tsc --noEmit`, `npm run lint` hijau. `npm run build` dijalankan pada task yang mengubah validasi, route, atau render.
- Migrasi baru hanya boleh menambah file `migrations/NNNN_*.sql`; jangan mengubah migrasi lama.
- Jangan mengubah `docs/technopreneurship/**` dan jangan commit file di luar scope task.
- Tanggal bisnis disimpan dan dikirim sebagai `YYYY-MM-DD`, bukan ISO datetime.
- Setiap perubahan perilaku harus disertai pembaruan dokumentasi di task yang sama atau Task 10.

## Review Focus

- Rate limit login tidak bisa dilewati hanya dengan mengganti header IP.
- Constraint database menolak `slots_available > slots_total` walau request melewati route.
- Tanggal `2026-01-01` tetap `1 Jan 2026` di zona waktu mana pun; input `type="date"` admin tidak kosong setelah edit.
- RSVP untuk match selesai/berlangsung ditolak tanpa mengubah slot atau membuat baris `rsvps`.
- Add FAQ tidak mengirim `question`/`answer` kosong ke API; baris draft tidak pernah tersimpan setengah jadi.
- Video membuka `item.url`; album bergdriveLink tetap bisa masuk halaman detail.
- Upload gagal terlihat oleh admin, bukan diam-diam menyimpan base64 2 MB ke database; gambar di atas batas piksel ditolak.
- Dokumentasi tidak lagi menjanjikan perilaku yang tidak ada (link mati, dev tanpa DB, data URL, `middleware.ts`, status plan).

---

## Task 0: Baseline dan guard rail

**Files:** tidak ada perubahan.

- [ ] Catat output `npm test`, `npm run lint`, `npx tsc --noEmit` di catatan eksekusi.
- [ ] Catat versi Node (`node -v`) dan pastikan Node 24.
- [ ] Konfirmasi `git status --short` bersih sebelum mulai.

**Commit:** tidak ada.

---

## Task 1: Rate limit login dengan bucket global (temuan #1)

**Files:**
- Modify: `src/lib/rate-limit.ts`
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `tests/rate-limit.test.ts`

**Interfaces:**
- `export const LOGIN_GLOBAL_RATE_LIMIT: RateLimitOptions` — `{ windowMs: 15 * 60 * 1000, max: 60 }`.
- `export async function consumeLoginAttempt(ip: string): Promise<{ allowed: boolean; retryAfterMs: number; scope: "ip" | "global" }>`.
- `export async function resetLoginIpBucket(ip: string): Promise<void>`.

- [ ] **Step 1: Tulis test yang gagal** di `tests/rate-limit.test.ts`.

```ts
import { createMemoryStore } from "../src/lib/rate-limit-store.ts";
import {
  consumeLoginAttempt,
  resetLoginIpBucket,
  setRateLimitStore,
} from "../src/lib/rate-limit.ts";

test("login attempts from many spoofed IPs still hit a global ceiling", async () => {
  setRateLimitStore(createMemoryStore());

  for (let i = 0; i < 60; i += 1) {
    const result = await consumeLoginAttempt(`10.0.0.${i}`);
    assert.equal(result.allowed, true);
  }

  const blocked = await consumeLoginAttempt("203.0.113.99");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.scope, "global");
});

test("resetting the IP bucket does not reset the global ceiling", async () => {
  setRateLimitStore(createMemoryStore());
  for (let i = 0; i < 60; i += 1) {
    await consumeLoginAttempt(`10.1.0.${i}`);
  }

  await resetLoginIpBucket("203.0.113.99");
  const blocked = await consumeLoginAttempt("203.0.113.99");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.scope, "global");
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal.**

```bash
node --test tests/rate-limit.test.ts
```

Gagal karena `consumeLoginAttempt` belum ada.

- [ ] **Step 3: Implementasi** di `src/lib/rate-limit.ts`.

```ts
export const LOGIN_GLOBAL_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 60,
};

export async function consumeLoginAttempt(ip: string) {
  const perIp = await consume("login", ip, RATE_LIMIT_DEFAULTS);
  if (!perIp.allowed) return { ...perIp, scope: "ip" as const };

  const global = await consume("login-global", "all", LOGIN_GLOBAL_RATE_LIMIT);
  if (!global.allowed) return { ...global, scope: "global" as const };

  return { allowed: true, retryAfterMs: 0, scope: "ip" as const };
}

export async function resetLoginIpBucket(ip: string) {
  await resetRateLimit("login", ip);
}
```

- [ ] **Step 4: Pakai di route login** `src/app/api/auth/login/route.ts`.

Ganti `consume("login", ip, RATE_LIMIT_DEFAULTS)` dengan `consumeLoginAttempt(ip)`. Ganti `resetRateLimit("login", ip)` dengan `resetLoginIpBucket(ip)`. Tetap jalankan rate limit sebelum membaca body. Jika `scope === "global"`, pesan 429 memakai teks yang sama; jangan membocorkan IP atau sisa kuota.

- [ ] **Step 5: Verifikasi.**

```bash
node --test tests/rate-limit.test.ts
npm test
npx tsc --noEmit
npm run lint
```

**Commit:** `fix(auth): add a global login bucket so spoofed IP headers cannot bypass rate limits`

---

## Task 2: Tanggal `YYYY-MM-DD` ujung ke ujung (temuan #5 dan #6)

**Files:**
- Modify: `src/lib/match-schema.ts`
- Modify: `src/app/api/albums/route.ts`
- Modify: `src/app/api/news/route.ts`
- Modify: `src/lib/db.ts`
- Create: `src/lib/pg-types.ts`
- Modify: `src/lib/format.ts` (ubah `formatDate`, hapus dead code nanti di Task 8)
- Create: `tests/pg-types.test.ts`
- Create: `tests/format.test.ts`
- Modify: `tests/match-schema.test.ts`
- Modify: `src/app/admin/rsvp/page.tsx`

**Interfaces:**
- `export function configurePgTypes(target?: Pick<typeof import("pg").types, "setTypeParser">): void` — memasang parser OID 1082 agar kolom `DATE` menjadi string apa adanya.
- `export function parseDateOnly(value: string): Date` — hanya untuk string persis `YYYY-MM-DD`, memakai komponen lokal.
- `formatDate(value: string): string` — memakai `parseDateOnly` bila bentuknya date-only, selain itu `new Date(value)`.

- [ ] **Step 1: Tulis test yang gagal.**

`tests/pg-types.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { configurePgTypes } from "../src/lib/pg-types.ts";

test("DATE columns are returned as plain YYYY-MM-DD strings", () => {
  const registered: Array<{ oid: number; parse: (value: string) => unknown }> = [];
  configurePgTypes({
    setTypeParser: (oid: number, parse: (value: string) => unknown) => {
      registered.push({ oid, parse });
    },
  });

  const date = registered.find((entry) => entry.oid === 1082);
  assert.ok(date, "expected an OID 1082 parser");
  assert.equal(date.parse("2026-01-01"), "2026-01-01");
});
```

`tests/format.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { formatDate, parseDateOnly } from "../src/lib/format.ts";

test("parseDateOnly keeps the calendar day regardless of timezone", () => {
  const date = parseDateOnly("2026-01-01");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 0);
  assert.equal(date.getDate(), 1);
});

test("formatDate renders a date-only string on the same day", () => {
  assert.equal(formatDate("2026-01-01"), "1 Jan 2026");
});

test("formatDate still accepts a full ISO datetime", () => {
  assert.equal(formatDate("2026-01-01T12:00:00.000Z"), "1 Jan 2026");
});
```

`tests/match-schema.test.ts` tambahkan:

```ts
test("create schema rejects impossible and non-ISO dates", () => {
  for (const date of ["2026-02-30", "2026-13-01", "01/02/2026", "5", "2026-01-01T00:00:00Z"]) {
    assert.equal(matchCreateSchema.safeParse({ ...base, date }).success, false, date);
  }
  assert.equal(matchCreateSchema.safeParse({ ...base, date: "2026-02-28" }).success, true);
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal.**

```bash
node --test tests/pg-types.test.ts tests/format.test.ts tests/match-schema.test.ts
```

- [ ] **Step 3: Implementasi parser tanggal** `src/lib/pg-types.ts`:

```ts
import { types } from "pg";

export function configurePgTypes(
  target: Pick<typeof types, "setTypeParser"> = types
): void {
  // OID 1082 = DATE. The default parser turns it into a JS Date at local
  // midnight, then JSON serializes it as an ISO timestamp and shifts the day.
  target.setTypeParser(1082, (value) => value);
}
```

Di `src/lib/db.ts`, panggil `configurePgTypes()` sebelum `new Pool(...)`.

- [ ] **Step 4: Ketatkan skema tanggal.** Di `src/lib/match-schema.ts`, `src/app/api/albums/route.ts`, dan `src/app/api/news/route.ts`, ganti:

```ts
z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date")
```

dengan:

```ts
z.iso.date("Invalid date (expected YYYY-MM-DD)")
```

- [ ] **Step 5: Perbaiki formatter** `src/lib/format.ts`:

```ts
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseDateOnly(value)
    : new Date(value);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
```

- [ ] **Step 6: Ganti pemakaian di admin RSVP** `src/app/admin/rsvp/page.tsx`. Ganti `new Date(m.date).toLocaleDateString(...)` dengan `formatDate(m.date)` agar header/kelompok tanggal tidak bergeser. Tambahkan import dari `@/lib/format`.

- [ ] **Step 7: Verifikasi.**

```bash
node --test tests/pg-types.test.ts tests/format.test.ts tests/match-schema.test.ts
npm test
npx tsc --noEmit
npm run lint
npm run build
```

**Commit:** `fix(dates): keep DATE values as YYYY-MM-DD and validate ISO dates strictly`

---

## Task 3: Integritas slot dua lapis (temuan #2)

**Files:**
- Create: `migrations/0004_match_slots_check.sql`
- Modify: `src/lib/slots.ts`
- Modify: `src/lib/match-schema.ts`
- Modify: `src/app/api/matches/route.ts`
- Modify: `tests/slots.test.ts`
- Create: `tests/integration/matches.test.ts`

**Interfaces:**
- `export function slotsWithinLimits(total: number, available: number): boolean` — `available` bilangan bulat, `0 <= available <= total`.
- PUT `/api/matches` mengembalikan `400` dengan pesan `Available slots cannot exceed total slots` bila hasil efektif melanggar.

- [ ] **Step 1: Tulis test murni yang gagal** di `tests/slots.test.ts`:

```ts
import { slotsWithinLimits } from "../src/lib/slots.ts";

test("slotsWithinLimits rejects availability above the total", () => {
  assert.equal(slotsWithinLimits(10, 10), true);
  assert.equal(slotsWithinLimits(10, 0), true);
  assert.equal(slotsWithinLimits(10, 11), false);
  assert.equal(slotsWithinLimits(10, -1), false);
  assert.equal(slotsWithinLimits(10, 2.5), false);
});
```

- [ ] **Step 2: Tulis test integrasi yang gagal** di `tests/integration/matches.test.ts`, mengikuti pola `tests/integration/rsvp.test.ts` (`TEST_DATABASE_URL`, skip bila kosong, import `query` dinamis, cleanup):

```ts
test("database rejects slots_available above slots_total", { skip }, async () => {
  const { query } = await import("../../src/lib/db.ts");
  const id = `test-match-${randomUUID()}`;
  await assert.rejects(() =>
    query(
      `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, "Invalid slots", "2026-01-01", "10:00", "Lapangan", 10, 11]
    )
  );
});
```

- [ ] **Step 3: Jalankan test, pastikan gagal.**

```bash
node --test tests/slots.test.ts
# dengan TEST_DATABASE_URL dan migrasi terpasang:
node --test tests/integration/matches.test.ts
```

Yang kedua gagal karena constraint belum ada.

- [ ] **Step 4: Buat migrasi** `migrations/0004_match_slots_check.sql`:

```sql
ALTER TABLE matches
  ADD CONSTRAINT matches_slots_available_range
  CHECK (slots_available >= 0 AND slots_available <= slots_total) NOT VALID;

UPDATE matches SET slots_available = 0 WHERE slots_available < 0;
UPDATE matches SET slots_available = slots_total WHERE slots_available > slots_total;

ALTER TABLE matches VALIDATE CONSTRAINT matches_slots_available_range;
```

- [ ] **Step 5: Implementasi helper** di `src/lib/slots.ts`:

```ts
export function slotsWithinLimits(total: number, available: number): boolean {
  return Number.isInteger(available) && available >= 0 && available <= total;
}
```

Pakai juga di `slotsWithinTotal` pada `src/lib/match-schema.ts` agar aturan hanya ditulis sekali.

- [ ] **Step 6: Validasi hasil efektif di PUT** `src/app/api/matches/route.ts`. Di dalam `withTransaction`, jika `updates.slotsTotal !== undefined || updates.slotsAvailable !== undefined`:

1. `SELECT slots_total, slots_available FROM matches WHERE id = $1 FOR UPDATE`.
2. Jika tidak ada baris, return `{ kind: "not_found" }`.
3. Hitung `total = updates.slotsTotal ?? current.slots_total`.
4. Hitung `available = updates.slotsAvailable ?? current.slots_available`. Bila hanya total yang berubah, tetap pakai `availableAfterTotalChange(...)`.
5. Bila `!slotsWithinLimits(total, available)`, return `{ kind: "invalid_slots" }`.
6. Tulis `slotsAvailable: available` ke `effectiveUpdates` agar `buildUpdate` menyimpan nilai yang sudah tervalidasi.

Tambahkan cabang `if (result.kind === "invalid_slots") return badRequest("Available slots cannot exceed total slots");`.

- [ ] **Step 7: Verifikasi.**

```bash
npm run db:migrate
node --test tests/slots.test.ts
npm run test:integration
npm test
npx tsc --noEmit
npm run lint
npm run build
```

**Commit:** `fix(matches): enforce slot bounds in the API and in the database`

---

## Task 4: Tolak RSVP untuk match yang sudah mulai/selesai (temuan #7)

**Files:**
- Modify: `src/lib/rsvp-utils.ts`
- Modify: `src/lib/rsvp-service.ts`
- Modify: `src/app/api/rsvps/route.ts`
- Modify: `tests/rsvp-utils.test.ts`
- Modify: `tests/integration/rsvp.test.ts`

**Interfaces:**
- `export function isRsvpOpen(status: "upcoming" | "ongoing" | "completed"): boolean` — hanya `upcoming`.
- `CreateRsvpResult` mendapat varian `{ kind: "closed" }`.
- POST `/api/rsvps` memetakan `closed` ke `409` dengan pesan `RSVP is closed for this match`.

- [ ] **Step 1: Tulis test murni yang gagal** di `tests/rsvp-utils.test.ts`:

```ts
test("only upcoming matches accept RSVPs", () => {
  assert.equal(isRsvpOpen("upcoming"), true);
  assert.equal(isRsvpOpen("ongoing"), false);
  assert.equal(isRsvpOpen("completed"), false);
});
```

- [ ] **Step 2: Tulis test integrasi yang gagal** di `tests/integration/rsvp.test.ts`. Tambahkan helper `insertMatchWithStatus(status)` dan test:

```ts
test("createRsvp rejects a completed match without changing slots", { skip }, async () => {
  const { createRsvp } = await import("../../src/lib/rsvp-service.ts");
  const matchId = await insertMatchWithStatus("completed");

  try {
    const result = await createRsvp({
      matchId,
      participants: [participant("6281234567891")],
    });
    assert.equal(result.kind, "closed");
    assert.equal(await getSlots(matchId), 10);
  } finally {
    await cleanup(matchId);
  }
});
```

Ulangi untuk `ongoing`.

- [ ] **Step 3: Jalankan test, pastikan gagal.**

- [ ] **Step 4: Implementasi.** Tambahkan `isRsvpOpen` di `src/lib/rsvp-utils.ts`. Di `src/lib/rsvp-service.ts`, ubah query menjadi `SELECT slots_available, status FROM matches WHERE id = $1 FOR UPDATE`, lalu:

```ts
if (!isRsvpOpen(row.status)) return { kind: "closed" as const };
```

Letakkan pengecekan status sebelum pengecekan slot. Di route, tambahkan cabang `closed` → `conflict("RSVP is closed for this match")`.

- [ ] **Step 5: Pastikan UI menampilkan pesan.** Periksa `src/components/views/schedule-detail-view.tsx` (atau form RSVP yang dipakai) menampilkan `error.message` dari API, bukan pesan generik. Jika belum, tampilkan pesan API apa adanya.

- [ ] **Step 6: Verifikasi.**

```bash
node --test tests/rsvp-utils.test.ts
npm run test:integration
npm test
npx tsc --noEmit
npm run lint
```

**Commit:** `fix(rsvp): close RSVPs once a match is ongoing or completed`

---

## Task 5: Add FAQ menyimpan draft, bukan mengirim field kosong (temuan #3)

**Files:**
- Create: `src/lib/faq.ts`
- Create: `tests/faq.test.ts`
- Modify: `src/app/admin/settings/page.tsx`
- Create: `e2e/admin-faq.spec.ts`

**Interfaces:**
- `export function canPersistFaq(faq: { question: string; answer: string }): boolean` — true hanya bila kedua field non-kosong setelah `trim()`.
- Admin menyimpan `draftFaqId: string | null`; draft tidak pernah dikirim ke API sampai kedua field terisi.

- [ ] **Step 1: Tulis test murni yang gagal** `tests/faq.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { canPersistFaq } from "../src/lib/faq.ts";

test("a FAQ draft is persistable only when both fields have content", () => {
  assert.equal(canPersistFaq({ question: "Apa itu?", answer: "Komunitas." }), true);
  assert.equal(canPersistFaq({ question: "", answer: "Komunitas." }), false);
  assert.equal(canPersistFaq({ question: "Apa itu?", answer: "   " }), false);
});
```

- [ ] **Step 2: Tulis E2E yang gagal** `e2e/admin-faq.spec.ts`. Salin helper `login(page)` dari `e2e/admin-modal.spec.ts` (setiap spec saat ini punya helper lokal; tidak ada modul bersama).

```ts
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
  await expect(page.getByDisplayValue("Jam berapa latihan?")).toBeVisible();
});
```

- [ ] **Step 3: Jalankan test, pastikan gagal.** `node --test tests/faq.test.ts` gagal karena modul belum ada; E2E gagal karena API mengembalikan 400.

- [ ] **Step 4: Implementasi helper** `src/lib/faq.ts`:

```ts
export function canPersistFaq(faq: { question: string; answer: string }): boolean {
  return faq.question.trim().length > 0 && faq.answer.trim().length > 0;
}
```

- [ ] **Step 5: Ubah alur admin** `src/app/admin/settings/page.tsx`:

1. Tambah state `const [draftFaqId, setDraftFaqId] = useState<string | null>(null);`
2. `addFaq()` tidak memanggil API. Buat `{ id: \`f${Date.now()}\`, question: "", answer: "" }`, tambahkan ke `faqList`, set `draftFaqId`. Bila `draftFaqId` sudah ada, jangan membuat draft kedua.
3. `saveFaqField(faq, field)`:
   - Bila `faq.id === draftFaqId` dan `!canPersistFaq(faq)`, return tanpa request.
   - Bila `faq.id === draftFaqId` dan `canPersistFaq(faq)`, panggil `createFaq({ id: faq.id, question: faq.question, answer: faq.answer })`, ganti `faqList` dengan hasil, lalu `setDraftFaqId(null)`.
   - Selain itu, pakai `updateFaqStore` seperti sekarang.
4. `deleteFaq` handler: bila `id === draftFaqId`, hapus hanya dari state lokal dan kosongkan `draftFaqId`; jangan panggil API.

- [ ] **Step 6: Verifikasi.**

```bash
node --test tests/faq.test.ts
npm test
npx tsc --noEmit
npm run lint
npm run test:e2e -- e2e/admin-faq.spec.ts
```

E2E butuh database dan dev server sesuai `playwright.config.ts`.

**Commit:** `fix(admin): keep new FAQ rows as local drafts until both fields are filled`

---

## Task 6: Video bisa diputar dan album Drive tetap punya detail (temuan #4 dan #9)

**Files:**
- Create: `src/lib/gallery-links.ts`
- Create: `tests/gallery-links.test.ts`
- Modify: `src/components/views/gallery-detail-view.tsx`
- Modify: `src/components/gallery-card.tsx`
- Modify: `e2e/public-pages.spec.ts`

**Interfaces:**
- `export function videoItemHref(item: Pick<AlbumItem, "type" | "url">): string | null` — hanya untuk `type === "video"` dan `url` non-kosong.
- `export function albumDetailHref(album: Pick<Album, "id">): string` — selalu `/gallery/<id>`.

- [ ] **Step 1: Tulis test murni yang gagal** `tests/gallery-links.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { albumDetailHref, videoItemHref } from "../src/lib/gallery-links.ts";

test("video items link to their own URL", () => {
  assert.equal(
    videoItemHref({ type: "video", url: "https://youtube.com/watch?v=abc" }),
    "https://youtube.com/watch?v=abc"
  );
  assert.equal(videoItemHref({ type: "image", url: "/api/uploads/a.jpg" }), null);
  assert.equal(videoItemHref({ type: "video", url: "" }), null);
});

test("albums always keep a detail link, even with a Drive link", () => {
  assert.equal(albumDetailHref({ id: "album-1" }), "/gallery/album-1");
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal.**

- [ ] **Step 3: Implementasi helper** `src/lib/gallery-links.ts`:

```ts
import type { Album, AlbumItem } from "@/types";

export function videoItemHref(item: Pick<AlbumItem, "type" | "url">): string | null {
  return item.type === "video" && item.url ? item.url : null;
}

export function albumDetailHref(album: Pick<Album, "id">): string {
  return `/gallery/${album.id}`;
}
```

- [ ] **Step 4: Perbaiki tile video** `src/components/views/gallery-detail-view.tsx`. Di dalam `album.items.map`, hitung `const videoHref = videoItemHref(item);`. Ganti overlay play yang tidak bisa diklik dengan anchor yang menutupi tile:

```tsx
{videoHref && (
  <a
    href={videoHref}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Putar video: ${album.title}`}
    className="absolute inset-0 flex items-center justify-center"
  >
    <span className="w-14 h-14 border-2 border-accent rounded-full flex items-center justify-center">
      <Play size={20} className="text-accent ml-1" />
    </span>
  </a>
)}
```

Jangan biarkan handler `onClick` lightbox menangkap klik anchor video.

- [ ] **Step 5: Kartu album selalu ke detail** `src/components/gallery-card.tsx`. Ganti percabangan `album.gdriveLink ? <a ...> : <Link ...>` menjadi selalu:

```tsx
<Link href={albumDetailHref(album)}>{CardContent}</Link>
```

Pertahankan badge "Google Drive" di kartu; tombol buka Drive sudah ada di halaman detail (`Buka Google Drive`).

- [ ] **Step 6: Tambah E2E** di `e2e/public-pages.spec.ts`: buka `/gallery`, klik kartu album pertama yang punya badge Drive (data demo `demo-album-02`), pastikan URL berakhir di `/gallery/`, lalu pastikan link `Buka Google Drive` punya `href` yang dimulai `https://drive.google.com/`.

- [ ] **Step 7: Verifikasi.**

```bash
node --test tests/gallery-links.test.ts
npm test
npx tsc --noEmit
npm run lint
npm run test:e2e -- e2e/public-pages.spec.ts
```

**Commit:** `fix(gallery): play video items and keep Drive albums reachable from the detail page`

---

## Task 7: Upload gagal terlihat, data URL ditolak, piksel dibatasi (temuan #8 dan #10)

**Files:**
- Modify: `src/lib/validation.ts`
- Modify: `src/lib/upload-image.ts`
- Modify: `src/lib/image-normalize.ts`
- Modify: `tests/validation.test.ts`
- Modify: `tests/image-normalize.test.ts`
- Modify: `tests/upload.test.ts` (bila menguji fallback)

**Interfaces:**
- `export const MAX_IMAGE_PIXELS = 40_000_000` (40 MP).
- `export function imageInputOptions(mime: ImageMime): { animated: boolean; limitInputPixels: number }`.
- `uploadImageFile(file): Promise<string>` melempar `Error` bila upload API gagal; tidak pernah mengembalikan data URL.

- [ ] **Step 1: Ubah test validasi lebih dulu.**

Di `tests/validation.test.ts`:

- Hapus impor `isDataImageUrl` (helper akan dihapus).
- Ubah test agar `isAllowedImageUrl("data:image/webp;base64,AAAA")` menjadi `false`.
- Hapus test "every image the validator accepts fits inside a JSON request body" atau ganti dengan batas body biasa.
- Hapus test `isDataImageUrl` yang sudah tidak relevan.

Di `tests/image-normalize.test.ts` tambahkan:

```ts
import { imageInputOptions, MAX_IMAGE_PIXELS } from "../src/lib/image-normalize.ts";

test("image input has an explicit pixel ceiling", () => {
  assert.equal(imageInputOptions("image/gif").animated, true);
  assert.equal(imageInputOptions("image/png").animated, false);
  assert.equal(imageInputOptions("image/jpeg").limitInputPixels, MAX_IMAGE_PIXELS);
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal.**

```bash
node --test tests/validation.test.ts tests/image-normalize.test.ts
```

- [ ] **Step 3: Tolak data URL di validator** `src/lib/validation.ts`. Hapus `DATA_IMAGE_PATTERN`, `MAX_IMAGE_DATA_URL_LENGTH`, `isDataImageUrl`, dan cabang data URL di `isAllowedImageUrl`. Perbarui komentar `MAX_JSON_BODY_BYTES` agar tidak lagi menyebut fallback data URL.

- [ ] **Step 4: Upload gagal secara terlihat** `src/lib/upload-image.ts`. Hapus semua `return compressed` pada jalur gagal. Lempar error yang bisa ditampilkan:

```ts
if (!response.ok) throw new Error("Upload gambar gagal. Coba lagi.");
// catch:
throw new Error("Upload gambar gagal. Periksa koneksi lalu coba lagi.");
```

Periksa setiap pemanggil (`src/app/admin/settings/page.tsx`, `news/page.tsx`, `gallery/page.tsx`) menangkap error dan menulisnya ke state error; jangan biarkan promise rejection tanpa pesan.

- [ ] **Step 5: Batasi piksel** `src/lib/image-normalize.ts`:

```ts
export const MAX_IMAGE_PIXELS = 40_000_000;

export function imageInputOptions(mime: ImageMime) {
  return {
    animated: mime === "image/gif",
    limitInputPixels: MAX_IMAGE_PIXELS,
  };
}

const input = sharp(bytes, imageInputOptions(mime)).rotate();
```

Pastikan error dari `sharp` tetap dipetakan ke `400` oleh route upload, bukan `500`.

- [ ] **Step 6: Verifikasi manual batas piksel.** Buat gambar 8000x6000 (48 MP) di mesin lokal, unggah lewat admin, dan pastikan ditolak dengan pesan 400. Jangan menambahkan test CI yang membuat gambar puluhan megapiksel karena boros memori.

- [ ] **Step 7: Verifikasi.**

```bash
node --test tests/validation.test.ts tests/image-normalize.test.ts tests/upload.test.ts
npm test
npx tsc --noEmit
npm run lint
npm run build
```

**Commit:** `fix(uploads): fail loudly instead of storing data URLs and cap decoded image pixels`

---

## Task 8: Hapus dead code formatter (temuan #11)

**Files:**
- Modify: `src/lib/format.ts`

- [ ] **Step 1: Pastikan tidak ada pemakai.**

```bash
grep -rn "formatDateFull\|formatRelativeTime" src tests e2e
```

Harus hanya menemukan definisi di `src/lib/format.ts`.

- [ ] **Step 2: Hapus** `formatDateFull` dan `formatRelativeTime` beserta komentar JSDoc-nya. Jangan mengubah `formatDate`, `formatTime`, atau `slugify`.

- [ ] **Step 3: Verifikasi.**

```bash
npx tsc --noEmit
npm run lint
npm test
```

**Commit:** `chore: remove unused date formatters`

---

## Task 9: Selaraskan kontrak secret dengan dokumentasi

**Files:**
- Modify: `tests/admin-session.test.ts`
- Modify: `docs/superpowers/specs/2026-11-07-clash-soccer-risk-hardening-design.md`
- Modify: `README.md`

**Konteks:** `src/lib/admin-session.ts` masih memakai fallback dev yang hardcoded dan mencatat peringatan. Spec risk-hardening menyatakan "Tidak ada secret default yang tertanam di source". Keputusan: pertahankan fallback dev (agar `npm run dev` dan E2E tidak putus), tetapi pastikan production menolak, lalu dokumentasikan dengan jujur.

- [ ] **Step 1: Tulis test invarian yang gagal** di `tests/admin-session.test.ts`:

```ts
test("production refuses to sign a session without ADMIN_AUTH_SECRET", async () => {
  const originalSecret = process.env.ADMIN_AUTH_SECRET;
  const originalEnv = process.env.NODE_ENV;
  delete process.env.ADMIN_AUTH_SECRET;

  try {
    // NODE_ENV is read-only in @types/node, but the runtime allows assignment.
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    await assert.rejects(
      () => createAdminSessionToken(USERNAME),
      /ADMIN_AUTH_SECRET/
    );
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_AUTH_SECRET;
    else process.env.ADMIN_AUTH_SECRET = originalSecret;

    if (originalEnv === undefined) delete process.env.NODE_ENV;
    else (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});
```

- [ ] **Step 2: Jalankan test.** Bila sudah lulus, itu berarti invarian sudah dijaga; tetap pertahankan test sebagai regression guard. Bila gagal, perbaiki `getAuthSecretKey` agar production selalu melempar sebelum fallback.

- [ ] **Step 3: Perbaiki spec** `docs/superpowers/specs/2026-11-07-clash-soccer-risk-hardening-design.md` baris 57. Ganti klaim "Tidak ada secret default yang tertanam di source" menjadi:

> `ADMIN_AUTH_SECRET` wajib tersedia di production; proses menolak start tanpa nilai tersebut. Di luar production, source memakai kunci fallback yang jelas berlabel dan mencatat peringatan sekali agar `npm run dev`/E2E tetap bisa jalan. Fallback itu tidak boleh dipakai untuk staging atau production.

- [ ] **Step 4: Tambahkan catatan di README** bagian Environment: production wajib 32+ karakter; di dev, nilai kosong memakai kunci fallback dengan peringatan log.

- [ ] **Step 5: Verifikasi.** `node --test tests/admin-session.test.ts`, `npm test`, `npx tsc --noEmit`.

**Commit:** `docs(auth): state the real dev-secret fallback and guard production against it`

---

## Task 10: Sinkronisasi README, AGENTS, spec, dan status plan

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/2026-11-09-followup-hardening-design.md`
- Modify: `docs/superpowers/specs/2026-11-09-public-identity-redesign-design.md`
- Modify: `docs/superpowers/plans/2026-11-07-clash-soccer-risk-hardening.md`
- Modify: `docs/superpowers/plans/2026-11-09-followup-hardening.md`
- Modify: `docs/superpowers/plans/2026-11-09-public-identity-redesign.md`
- Modify: `docs/superpowers/plans/2026-11-09-clash-soccer-audit-remediation.md`
- Create: `docs/superpowers/README.md`

> Nomor baris di bawah adalah posisi saat plan ditulis. Cari teksnya bila sudah bergeser karena Task 9 juga menyentuh README.

- [ ] **Step 1: README.**
  - Baris 59-61: hapus tautan ke `CARA_RUN_PROJECT.md` yang tidak ada. Ganti dengan "README ini adalah acuan tunggal; panduan lama sudah dihapus."
  - Baris 83: pisahkan klaim. `npm run build` tidak butuh database; `npm run dev` butuh database untuk halaman yang membaca data.
  - Baris 217: tulis bahwa `src/proxy.ts` menjaga halaman `/admin/**`, sedangkan route API admin memanggil `requireAdmin()` di handler.
  - Baris 220: ganti "allowlist MIME" menjadi "tipe ditentukan dari magic bytes, bukan `file.type`, lalu di-decode dan di-re-encode dengan `sharp`".
  - Baris 223-231: hapus penjelasan fallback data URL 2 MB. Ganti dengan "Gambar selalu dikirim ke `/api/uploads`; bila upload gagal, admin melihat error dan tidak ada base64 yang disimpan." Tambahkan batas 40 MP.
  - Baris 240-243: tambahkan "Login dibatasi 5/15 menit per IP dan 60/15 menit global; header IP hanya boleh dipercaya bila reverse proxy menimpanya."
  - Baris 265-268: tambahkan peringatan bahwa aplikasi yang diekspos langsung tanpa proxy bisa dipalsukan header-nya, karena itu bucket global tetap berlaku.

- [ ] **Step 2: AGENTS.md.**
  - Bagian Rate limits: `Login: 5/15 min per IP + 60/15 min global`.
  - Bagian Known quirks atau konvensi: tambahkan "Kolom `DATE` diparse sebagai string `YYYY-MM-DD` (`src/lib/pg-types.ts`); API menolak datetime untuk field tanggal."
  - Tambahkan `npm run db:init` ke daftar command sebagai alias lama `db:migrate` bila belum ada.
  - Tambahkan catatan batas 40 MP pada bullet upload.

- [ ] **Step 3: Spec follow-up.**
  - Baris 4: `Status: Dieksekusi 2026-11-09; bukti: .superpowers/sdd/2026-11-09-followup-hardening/progress.md`.
  - Baris 66: ganti `middleware.ts` menjadi `src/proxy.ts` (Next 16 memakai nama `proxy.ts`).

- [ ] **Step 4: Spec public identity.**
  - Baris 108: ganti `#E4000F` menjadi `#C4000D` agar sama dengan token `--color-crest`. Tegaskan `#F70008` hanya nilai sampel logo sumber, bukan token teks.
  - Bila rasio kontras disebut, hitung ulang terhadap `#C4000D` di atas `--color-ink` dan tulis hasilnya; jangan mempertahankan angka lama.

- [ ] **Step 5: Status plan.** Untuk `2026-11-09-followup-hardening.md` dan `2026-11-09-public-identity-redesign.md`, tambahkan blok setelah judul:

```md
> **Status (2026-11-11):** Dieksekusi. Checkbox dibiarkan kosong karena eksekusi memakai ledger di `.superpowers/sdd/<nama-plan>/progress.md`. Jangan jalankan ulang tanpa membaca ledger dan diff terlebih dahulu.
```

Untuk `2026-11-07-clash-soccer-risk-hardening.md`, tambahkan:

```md
> **Status (2026-11-11):** Tidak ada ledger eksekusi. Beberapa item terverifikasi ada di kode (`withTransaction`, `.env.example`, CSP nonce, focus trap), tetapi status per langkah belum tercatat. Audit diff sebelum menjalankan ulang.
```

Untuk `2026-11-09-clash-soccer-audit-remediation.md`, tandai langkah manual yang belum dijalankan:

```md
- [ ] Manual smoke of admin flows... **Tidak dijalankan (tidak ada database di environment agen).**
```

- [ ] **Step 6: Buat indeks** `docs/superpowers/README.md` (maksimal 15 baris) yang menjelaskan:
  - `specs/` = keputusan desain, `plans/` = rencana eksekusi, `.superpowers/sdd/` = ledger eksekusi.
  - Status plan/spec harus salah satu: `Draft`, `Menunggu persetujuan`, `Dieksekusi`, `Dibatalkan`.
  - Checkbox kosong bukan bukti pekerjaan belum dikerjakan; ledger adalah bukti utama.

- [ ] **Step 7: Verifikasi tautan relatif.** Jalankan skrip PowerShell yang mengekstrak `](...)` dari semua `.md` dan memeriksa `Test-Path` untuk tautan yang bukan URL. Semua tautan relatif harus ada.

```powershell
Get-ChildItem -Recurse -Filter *.md | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\' } | ForEach-Object {
  $file = $_
  Select-String -Path $file.FullName -Pattern '\]\(([^)]+)\)' -AllMatches | ForEach-Object {
    $_.Matches | ForEach-Object {
      $target = $_.Groups[1].Value.Split('#')[0]
      if ($target -and $target -notmatch '^(https?:|mailto:|#)') {
        $resolved = Join-Path $file.DirectoryName $target
        if (-not (Test-Path $resolved)) { "BROKEN: $($file.FullName) -> $target" }
      }
    }
  }
}
```

- [ ] **Step 8: Verifikasi akhir.**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

**Commit:** `docs: correct stale setup, security, and plan-status claims`

---

## Final Verification (wajib sebelum menyatakan selesai)

- [ ] `npm test` — semua unit test lulus; catat jumlahnya.
- [ ] `npx tsc --noEmit` — 0 error.
- [ ] `npm run lint` — 0 error.
- [ ] `npm run build` — sukses dengan `DATABASE_URL` tidak di-set.
- [ ] `npm run test:integration` — dijalankan dengan `TEST_DATABASE_URL` dan migrasi 0004 terpasang.
- [ ] `npm run test:e2e` — minimal `e2e/admin-faq.spec.ts` dan `e2e/public-pages.spec.ts`.
- [ ] `npm run smoke:db` — bila database tersedia.
- [ ] Tidak ada tautan `.md` relatif yang rusak.
- [ ] `git status` hanya memuat file yang tercantum di task.

## Out of Scope

- Deploy, konfigurasi reverse proxy nyata, dan pengujian di production.
- Redesign visual halaman publik.
- Perubahan pada `docs/technopreneurship/**`.
- Menambahkan dependency runtime baru.
- Mengubah migrasi `0001`–`0003` yang sudah diterapkan.

