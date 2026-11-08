# Follow-up Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menutup seluruh saran lanjutan audit: a11y modal, validasi env, password hashing, CSP nonce, SEO, migrasi DB, rate limit bersama, object storage, observability, CI, smoke test, E2E, dan README.

**Architecture:** Fitur eksternal berada di balik adapter dengan fallback lokal. Logika murni ditulis test-first dengan Node test runner, lalu dipakai route/komponen. Setiap fase berakhir dengan pemeriksaan penuh dan commit terstruktur.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, PostgreSQL (`pg`), Zod, Node 24 `node --test`, `node:crypto`, Playwright (devDependency).

**Spec:** `docs/superpowers/specs/2026-11-09-followup-hardening-design.md`

## Global Constraints

- Semua respons/komentar kode mengikuti gaya yang ada; UI copy berbahasa Indonesia.
- Tidak menambah dependency runtime baru. Satu-satunya dependency baru: `@playwright/test` (devDependency).
- Semua logika murni baru wajib punya test yang gagal sebelum implementasi.
- Setelah setiap task: `npm test`, `npx tsc --noEmit`, `npm run lint` harus hijau. `npm run build` dijalankan pada task yang mengubah routing/render.
- Tidak boleh ada data palsu saat request gagal.
- Semua operasi tulis multi-row tetap memakai `withTransaction`.
- Rahasia tidak boleh masuk log, pesan error, atau respons API.
- Dokumen `docs/technopreneurship/**` tidak boleh di-commit atau diubah.
- Next 16: `params` adalah Promise, middleware bernama `proxy.ts`, dan halaman publik sudah `force-dynamic`.

## Review Focus

- Env tidak lengkap di produksi harus berhenti dengan pesan yang menyebut nama variabel, bukan nilai; dev hanya memperingatkan.
- Password tersimpan sebagai hash scrypt dan plaintext lama tetap bisa login; hash rusak harus gagal tertutup (deny), bukan membuka akses.
- CSP nonce tidak boleh memblokir script Next sendiri, style Tailwind, atau inline style framer-motion.
- Rate limit async tidak boleh kehilangan kemampuan menolak request saat store gagal; kegagalan store harus fallback aman.
- Upload harus menolak file terlalu besar, MIME tak diizinkan, dan path traversal; URL yang dikembalikan harus dapat diakses.
- Migrasi harus idempoten, tidak pernah menjalankan ulang versi yang sudah tercatat, dan rollback bersih saat gagal.
- Modal harus mengembalikan fokus ke pemicu dan tidak membiarkan Tab keluar dari dialog.
- Test integrasi/E2E/smoke harus skip dengan pesan jelas saat infra tidak tersedia, tidak gagal palsu.

---

### Task 1: Focus trap logic + Modal component

**Files:**
- Create: `src/lib/focus.ts`
- Create: `src/components/ui/modal.tsx`
- Create: `tests/focus.test.ts`
- Modify: `src/app/admin/gallery/page.tsx`
- Modify: `src/app/admin/news/page.tsx`
- Modify: `src/app/admin/matches/page.tsx`

**Interfaces:**
- Produces: `nextFocusIndex(current: number, total: number, shift: boolean): number`
- Produces: `getFocusableElements(root: HTMLElement): HTMLElement[]`
- Produces: `<Modal open={boolean} onClose={() => void} labelledBy?: string className?: string>{children}</Modal>`

- [ ] **Step 1: Write the failing test** in `tests/focus.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { nextFocusIndex } from "../src/lib/focus.ts";

test("nextFocusIndex wraps forward past the last element", () => {
  assert.equal(nextFocusIndex(2, 3, false), 0);
});

test("nextFocusIndex wraps backward before the first element", () => {
  assert.equal(nextFocusIndex(0, 3, true), 2);
});

test("nextFocusIndex moves normally in both directions", () => {
  assert.equal(nextFocusIndex(0, 3, false), 1);
  assert.equal(nextFocusIndex(2, 3, true), 1);
});

test("nextFocusIndex returns 0 for an empty list", () => {
  assert.equal(nextFocusIndex(4, 0, false), 0);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/focus.test.ts`
Expected: FAIL karena modul `src/lib/focus.ts` tidak ada.

- [ ] **Step 3: Implement `src/lib/focus.ts`**

`nextFocusIndex` menangani `total <= 0`, lalu `(current + (shift ? -1 : 1) + total) % total`.
`getFocusableElements` memakai selector `a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])`, memfilter elemen `hidden`/`disabled`, dan mengembalikan array.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --test tests/focus.test.ts`
Expected: PASS 4/4.

- [ ] **Step 5: Implement `src/components/ui/modal.tsx`**

Client component. Saat `open`:
- simpan `document.activeElement` sebagai pemicu,
- fokus elemen pertama di dalam dialog,
- `keydown` pada dialog: Tab/Shift+Tab memakai `nextFocusIndex`, Escape memanggil `onClose`,
- `document.body.style.overflow = "hidden"`, dipulihkan saat cleanup,
- fokus kembali ke pemicu saat cleanup.
Render `null` jika `!open`. Dialog memakai `role="dialog"`, `aria-modal="true"`, `aria-labelledby={labelledBy}`, class overlay yang ada sekarang.

- [ ] **Step 6: Ganti modal di tiga halaman admin**

Ganti blok `{modalOpen && (<div className="fixed inset-0 ...">…)}` dengan `<Modal open={modalOpen} onClose={() => setModalOpen(false)} labelledBy="...">…</Modal>`. Pertahankan tombol close dan isi form; hapus overlay manual. Pastikan id judul modal unik (`gallery-modal-title`, `news-modal-title`, `match-modal-title`).

- [ ] **Step 7: Verify**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`
Expected: semua hijau; build sukses.

- [ ] **Step 8: Commit**

```bash
git add src/lib/focus.ts src/components/ui/modal.tsx tests/focus.test.ts src/app/admin/gallery/page.tsx src/app/admin/news/page.tsx src/app/admin/matches/page.tsx
git commit -m "feat(a11y): trap focus in admin modals"
```

---

### Task 2: Password hashing

**Files:**
- Create: `src/lib/password.ts`
- Create: `scripts/hash-password.mjs`
- Create: `tests/password.test.ts`
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `src/app/api/auth/status/route.ts` (hanya jika memeriksa password)

**Interfaces:**
- Produces: `hashPassword(password: string): string` (format `scrypt$<salt-b64>$<hash-b64>`)
- Produces: `verifyPassword(password: string, stored: string): boolean`

- [ ] **Step 1: Write the failing test** in `tests/password.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/password.ts";

test("hashPassword produces a scrypt hash and verifies the same password", () => {
  const stored = hashPassword("rahasia-123");
  assert.match(stored, /^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.equal(verifyPassword("rahasia-123", stored), true);
});

test("verifyPassword rejects a wrong password", () => {
  assert.equal(verifyPassword("salah", hashPassword("rahasia-123")), false);
});

test("verifyPassword accepts a legacy plaintext secret", () => {
  assert.equal(verifyPassword("plain-secret", "plain-secret"), true);
  assert.equal(verifyPassword("wrong", "plain-secret"), false);
});

test("verifyPassword denies malformed hashes", () => {
  assert.equal(verifyPassword("x", "scrypt$not-enough-parts"), false);
  assert.equal(verifyPassword("x", "scrypt$%%%$%%%"), false);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/password.test.ts`
Expected: FAIL karena modul belum ada.

- [ ] **Step 3: Implement `src/lib/password.ts`**

`hashPassword` memakai `randomBytes(16)` dan `scryptSync(password, salt, 64)`; `verifyPassword` mendeteksi awalan `scrypt$`, membandingkan dengan `timingSafeEqual`, dan mengembalikan `false` untuk format rusak. Plaintext dibandingkan lewat hash SHA-256 agar panjang sama.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --test tests/password.test.ts`
Expected: PASS 4/4.

- [ ] **Step 5: Create `scripts/hash-password.mjs`**

Membaca password dari argumen pertama atau `ADMIN_PASSWORD`, menolak input kosong, mencetak `ADMIN_PASSWORD_HASH=<hash>`.

- [ ] **Step 6: Wire login**

Di `src/app/api/auth/login/route.ts`, ganti perbandingan password dengan `verifyPassword(password, process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || "")`. Jika keduanya kosong, tetap `serverError`. Username tetap timing-safe. Hapus helper `timingSafeEqual` lokal yang tidak lagi dipakai.

- [ ] **Step 7: Verify**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`
Expected: hijau.

- [ ] **Step 8: Commit**

```bash
git add src/lib/password.ts scripts/hash-password.mjs tests/password.test.ts src/app/api/auth/login/route.ts
git commit -m "feat(security): hash admin password with scrypt"
```

---

### Task 3: Environment validation

**Files:**
- Create: `src/lib/env.ts`
- Create: `tests/env.test.ts`
- Modify: `src/app/api/health/route.ts`
- Modify: `src/lib/db.ts` (panggil validasi saat startup)
- Modify: `src/lib/admin-auth.ts` (gunakan hasil validasi secret)

**Interfaces:**
- Consumes: `hashPassword`/`verifyPassword` tidak dipakai langsung.
- Produces: `type EnvIssue = { key: string; kind: "missing" | "weak" | "invalid"; message: string }`
- Produces: `validateEnv(env: NodeJS.ProcessEnv, isProduction: boolean): EnvIssue[]`
- Produces: `formatEnvIssues(issues: EnvIssue[]): string[]`
- Produces: `assertEnv(env?: NodeJS.ProcessEnv): void`

- [ ] **Step 1: Write the failing test** in `tests/env.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { validateEnv, formatEnvIssues } from "../src/lib/env.ts";

const valid = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  ADMIN_USERNAME: "admin",
  ADMIN_AUTH_SECRET: "x".repeat(32),
  ADMIN_PASSWORD_HASH: "scrypt$c2FsdA==$aGFzaA==",
  SITE_URL: "https://example.com",
};

test("validateEnv accepts a complete production environment", () => {
  assert.deepEqual(validateEnv(valid, true), []);
});

test("validateEnv reports every missing production key", () => {
  const issues = validateEnv({}, true);
  const keys = issues.map((i) => i.key).sort();
  assert.deepEqual(keys, ["ADMIN_AUTH_SECRET", "ADMIN_PASSWORD", "ADMIN_USERNAME", "DATABASE_URL", "SITE_URL"]);
});

test("validateEnv reports a weak auth secret", () => {
  const issues = validateEnv({ ...valid, ADMIN_AUTH_SECRET: "short" }, true);
  assert.equal(issues.some((i) => i.key === "ADMIN_AUTH_SECRET" && i.kind === "weak"), true);
});

test("validateEnv accepts ADMIN_PASSWORD as an alternative to a hash", () => {
  const { ADMIN_PASSWORD_HASH, ...rest } = valid;
  assert.deepEqual(validateEnv({ ...rest, ADMIN_PASSWORD: "secret" }, true), []);
});

test("validateEnv only warns in development", () => {
  assert.deepEqual(validateEnv({}, false), []);
});

test("formatEnvIssues never includes secret values", () => {
  const issues = validateEnv({ ...valid, ADMIN_AUTH_SECRET: "short" }, true);
  const text = formatEnvIssues(issues).join("\n");
  assert.match(text, /ADMIN_AUTH_SECRET/);
  assert.doesNotMatch(text, /short/);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/env.test.ts`
Expected: FAIL karena modul belum ada.

- [ ] **Step 3: Implement `src/lib/env.ts`**

Aturan produksi: `DATABASE_URL`, `ADMIN_USERNAME`, `SITE_URL` wajib; `ADMIN_AUTH_SECRET` wajib minimal 32 karakter; salah satu `ADMIN_PASSWORD_HASH`/`ADMIN_PASSWORD` wajib. `SITE_URL` harus lolos `new URL` dan protokol `http:`/`https:`. `assertEnv` melempar `Error` berisi `formatEnvIssues` di produksi, dan hanya `console.warn` di dev.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --test tests/env.test.ts`
Expected: PASS 6/6.

- [ ] **Step 5: Wire startup and health**

`src/lib/db.ts` memanggil `assertEnv()` sebelum membuat `Pool` (impor statis). `/api/health` mengembalikan `{ status: "ok"|"degraded", issues: string[] }` tanpa nilai rahasia, status 503 jika ada issue. `admin-auth.ts` memakai `ADMIN_AUTH_SECRET` yang sudah divalidasi; fallback dev tetap ada.

- [ ] **Step 6: Verify**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`
Expected: hijau. Build berjalan dengan env dev yang ada.

- [ ] **Step 7: Commit**

```bash
git add src/lib/env.ts tests/env.test.ts src/app/api/health/route.ts src/lib/db.ts src/lib/admin-auth.ts
git commit -m "feat(security): validate environment configuration"
```

---

### Task 4: SEO — sitemap, robots, JSON-LD

**Files:**
- Create: `src/lib/seo.ts`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/components/json-ld.tsx`
- Create: `tests/seo.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `buildSitemapEntries(baseUrl: string, paths: string[]): Array<{ url: string }>`
- Produces: `buildSportsClubJsonLd(input: { name: string; description: string; url: string; logo?: string }): Record<string, unknown>`
- Produces: `<JsonLd data={Record<string, unknown>} />`

- [ ] **Step 1: Write the failing test** in `tests/seo.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildSitemapEntries, buildSportsClubJsonLd } from "../src/lib/seo.ts";

test("buildSitemapEntries joins paths to the base url", () => {
  const entries = buildSitemapEntries("https://example.com", ["/", "/news", "/faq"]);
  assert.deepEqual(entries.map((e) => e.url), [
    "https://example.com/",
    "https://example.com/news",
    "https://example.com/faq",
  ]);
});

test("buildSitemapEntries tolerates trailing slashes and duplicate slashes", () => {
  const entries = buildSitemapEntries("https://example.com/", ["/news"]);
  assert.deepEqual(entries.map((e) => e.url), ["https://example.com/news"]);
});

test("buildSportsClubJsonLd emits SportsClub data", () => {
  const data = buildSportsClubJsonLd({
    name: "Clash.Soccer",
    description: "Komunitas mini soccer",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
  });
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "SportsClub");
  assert.equal(data.name, "Clash.Soccer");
  assert.equal(data.logo, "https://example.com/logo.png");
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/seo.test.ts`
Expected: FAIL karena modul belum ada.

- [ ] **Step 3: Implement `src/lib/seo.ts`**

`buildSitemapEntries` menormalkan base dengan `base.replace(/\/+$/, "")` dan path dengan `"/" + path.replace(/^\/+/, "")`, kecuali path `/` yang menghasilkan base + `/`. `buildSportsClubJsonLd` mengembalikan objek dengan `@context`, `@type`, `name`, `description`, `url`, dan `logo` hanya jika diisi.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --test tests/seo.test.ts`
Expected: PASS 3/3.

- [ ] **Step 5: Add route conventions**

`src/app/sitemap.ts` mengembalikan `buildSitemapEntries(SITE_URL, ["/", "/schedule", "/news", "/gallery", "/faq", "/about", "/contact"])` dengan `changeFrequency` dan `priority`. `src/app/robots.ts` mengizinkan `/`, melarang `/admin` dan `/api`, dan menunjuk `SITE_URL/sitemap.xml`. `SITE_URL` dibaca dari env dengan fallback `http://localhost:3000` hanya di non-production.

- [ ] **Step 6: Add `JsonLd` and metadataBase**

`src/components/json-ld.tsx` adalah async server component yang membaca `headers()` untuk `x-nonce`, lalu merender `<script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`. Tambahkan `metadataBase: new URL(SITE_URL)` di `src/app/layout.tsx` (fallback dev). Sisipkan `<JsonLd data={buildSportsClubJsonLd(...)} />` di halaman utama.

- [ ] **Step 7: Verify**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`
Expected: hijau; rute `/sitemap.xml` dan `/robots.txt` muncul di build.

- [ ] **Step 8: Commit**

```bash
git add src/lib/seo.ts src/app/sitemap.ts src/app/robots.ts src/components/json-ld.tsx tests/seo.test.ts src/app/layout.tsx src/app/page.tsx
git commit -m "feat(seo): add sitemap, robots, and structured data"
```

---

### Task 5: CSP nonce via `proxy.ts`

**Files:**
- Create: `src/lib/csp.ts`
- Create: `src/proxy.ts`
- Create: `tests/csp.test.ts`
- Modify: `next.config.ts`

**Interfaces:**
- Produces: `buildCsp(nonce: string, isDev: boolean): string`
- Produces: `createNonce(): string`

- [ ] **Step 1: Write the failing test** in `tests/csp.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildCsp } from "../src/lib/csp.ts";

test("production CSP uses a nonce and no unsafe-inline scripts", () => {
  const csp = buildCsp("abc123", false);
  assert.match(csp, /script-src 'self' 'nonce-abc123' 'strict-dynamic'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test("development CSP allows eval for React refresh", () => {
  assert.match(buildCsp("abc123", true), /unsafe-eval/);
});

test("CSP keeps required security directives", () => {
  const csp = buildCsp("abc123", false);
  for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'"]) {
    assert.ok(csp.includes(directive), directive);
  }
});

test("CSP allows inline styles and the image hosts the app uses", () => {
  const csp = buildCsp("abc123", false);
  assert.match(csp, /style-src 'self' 'unsafe-inline'/);
  assert.match(csp, /img-src 'self' data: blob: https:\/\/lh3\.googleusercontent\.com https:\/\/images\.unsplash\.com/);
  assert.match(csp, /frame-src 'self' https:\/\/www\.google\.com/);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/csp.test.ts`
Expected: FAIL karena modul belum ada.

- [ ] **Step 3: Implement `src/lib/csp.ts`**

`createNonce` memakai `crypto.randomUUID()` yang di-encode base64. `buildCsp` merangkai satu baris direktif sesuai spesifikasi: `default-src 'self'`, `script-src 'self' 'nonce-<nonce>' 'strict-dynamic'` + `'unsafe-eval'` di dev, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.unsplash.com`, `font-src 'self'`, `frame-src 'self' https://www.google.com`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --test tests/csp.test.ts`
Expected: PASS 4/4.

- [ ] **Step 5: Implement `src/proxy.ts`**

Ekspor `proxy(request: NextRequest)` yang membuat nonce, menyetel `x-nonce` dan `Content-Security-Policy` di request headers, membuat `NextResponse.next({ request: { headers } })`, dan menyetel header CSP di response. Matcher mengecualikan aset statis: `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)`.

- [ ] **Step 6: Remove CSP from `next.config.ts`**

Hapus entri `Content-Security-Policy` dari `headers()` (header keamanan lain tetap). Hapus variabel `csp` yang tidak dipakai.

- [ ] **Step 7: Verify in browser**

Run: `npm run build`, lalu `npm run start` di background dan buka halaman utama.
Expected: halaman termuat, tidak ada error CSP/hydration di console. Jika hydration gagal, hentikan task dan kembali ke desain CSP lama sebelum commit.

- [ ] **Step 8: Commit**

```bash
git add src/lib/csp.ts src/proxy.ts tests/csp.test.ts next.config.ts
git commit -m "feat(security): add nonce-based CSP via proxy"
```

---

### Task 6: Migration runner

**Files:**
- Create: `migrations/0001_init.sql`
- Create: `migrations/0002_indexes.sql`
- Create: `src/lib/migrations.ts`
- Create: `scripts/migrate.mjs`
- Create: `tests/migrations.test.ts`
- Modify: `scripts/init-db.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `type MigrationFile = { version: string; name: string }`
- Produces: `parseMigrationFileName(fileName: string): MigrationFile | null`
- Produces: `selectPendingMigrations(files: string[], applied: string[]): MigrationFile[]`

- [ ] **Step 1: Write the failing test** in `tests/migrations.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseMigrationFileName, selectPendingMigrations } from "../src/lib/migrations.ts";

test("parseMigrationFileName accepts numbered sql files", () => {
  assert.deepEqual(parseMigrationFileName("0001_init.sql"), { version: "0001", name: "init" });
});

test("parseMigrationFileName rejects files without a numeric prefix", () => {
  assert.equal(parseMigrationFileName("init.sql"), null);
  assert.equal(parseMigrationFileName("0001_init.txt"), null);
});

test("selectPendingMigrations returns unapplied files in order", () => {
  const pending = selectPendingMigrations(
    ["0003_third.sql", "0001_first.sql", "0002_second.sql"],
    ["0001"]
  );
  assert.deepEqual(pending.map((m) => m.version), ["0002", "0003"]);
});

test("selectPendingMigrations ignores already applied and invalid files", () => {
  const pending = selectPendingMigrations(["0001_a.sql", "notes.txt"], ["0001"]);
  assert.deepEqual(pending, []);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/migrations.test.ts`
Expected: FAIL karena modul belum ada.

- [ ] **Step 3: Implement `src/lib/migrations.ts`**

Regex `/^(\d{4})_([A-Za-z0-9_-]+)\.sql$/`. `selectPendingMigrations` memfilter `null`, membuang versi yang sudah ada, dan mengurutkan berdasarkan `version` ascending.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --test tests/migrations.test.ts`
Expected: PASS 4/4.

- [ ] **Step 5: Create migration files**

`migrations/0001_init.sql` berisi isi `src/lib/schema.sql` saat ini (tabel + seed). `migrations/0002_indexes.sql` berisi `CREATE INDEX IF NOT EXISTS idx_rsvps_match_id ON rsvps(match_id);`, `idx_album_items_album_id`, `idx_matches_date`, dan `CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL);`.

- [ ] **Step 6: Implement `scripts/migrate.mjs`**

Membuat `schema_migrations(version text primary key, applied_at timestamptz default now())`, membaca folder `migrations`, memilih pending, lalu untuk setiap file: `BEGIN`, jalankan SQL, `INSERT INTO schema_migrations`, `COMMIT`; `ROLLBACK` saat gagal. Flag `--dry-run` mencetak daftar pending, `--status` mencetak versi terpasang. Pesan sukses: `Applied N migration(s).`

- [ ] **Step 7: Update init and package scripts**

`scripts/init-db.mjs` mendelegasikan ke logika runner (impor helper yang sama atau jalankan `migrate.mjs`). Tambahkan `"db:migrate": "node scripts/migrate.mjs"` dan biarkan `"db:init"` untuk kompatibilitas.

- [ ] **Step 8: Verify**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, dan `node scripts/migrate.mjs --dry-run`
Expected: hijau; dry-run mencetak `0001` dan `0002` (atau "No pending migrations" jika DB sudah termigrasi).

- [ ] **Step 9: Commit**

```bash
git add migrations src/lib/migrations.ts scripts/migrate.mjs scripts/init-db.mjs tests/migrations.test.ts package.json
git commit -m "feat(db): add versioned migration runner and indexes"
```

---

### Task 7: RSVP service + integration tests

**Files:**
- Create: `src/lib/rsvp-service.ts`
- Create: `tests/integration/rsvp.test.ts`
- Modify: `src/app/api/rsvps/route.ts`
- Modify: `package.json` (script `test:integration`)

**Interfaces:**
- Produces: `createRsvp(input: { matchId: string; participants: Participant[] }): Promise<CreateRsvpResult>`
- Produces: `type CreateRsvpResult = { kind: "ok"; id: string; registeredAt: string } | { kind: "not_found" } | { kind: "no_slots" } | { kind: "duplicate"; duplicates: string[] }`
- Produces: `deleteRsvp(id: string): Promise<{ kind: "ok" } | { kind: "not_found" }>`
- Produces: `listRsvps(matchId?: string): Promise<RsvpEntry[]>`

- [ ] **Step 1: Write the failing integration test** in `tests/integration/rsvp.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const enabled = Boolean(process.env.TEST_DATABASE_URL);
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

test("createRsvp decrements available slots", { skip: !enabled && "TEST_DATABASE_URL not set" }, async () => {
  const { query } = await import("../../src/lib/db.ts");
  const { createRsvp } = await import("../../src/lib/rsvp-service.ts");
  const matchId = `test-${randomUUID()}`;
  await query("INSERT INTO matches (id, title, date, time, location, slots_total, slots_available) VALUES ($1,$2,$3,$4,$5,$6,$7)", [matchId, "Test", "2026-01-01", "10:00", "Lapangan", 10, 10]);
  const result = await createRsvp({ matchId, participants: [{ name: "A", whatsapp: "6281234567890", jerseySize: "M" }] });
  assert.equal(result.kind, "ok");
  const { rows } = await query<{ slots_available: number }>("SELECT slots_available FROM matches WHERE id=$1", [matchId]);
  assert.equal(rows[0].slots_available, 9);
  await query("DELETE FROM matches WHERE id=$1", [matchId]);
});
```

Tambahkan test berikut dengan pola yang sama:
- `createRsvp rejects duplicate WhatsApp numbers inside one request and keeps slots unchanged`
- `createRsvp rejects a full match`
- `createRsvp returns not_found for an unknown match`
- `deleteRsvp restores slots and is idempotent for a missing id`

- [ ] **Step 2: Run it and confirm it fails (or skips)**

Run: `$env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clash_soccer_test"; node --test tests/integration/rsvp.test.ts`
Expected dengan DB: FAIL karena `rsvp-service.ts` belum ada. Tanpa DB: SKIP dengan pesan jelas.

- [ ] **Step 3: Extract the service**

Pindahkan `parseParticipants`, `mapRsvp`, dan query `getRsvps` dari route ke `src/lib/rsvp-service.ts` sebagai `listRsvps`. Implementasikan `createRsvp`/`deleteRsvp` dengan isi transaksi yang sama seperti route saat ini (`FOR UPDATE`, cek slot, duplikat, insert, update, restore). Panggil `invalidateDataCache()` setelah mutasi sukses.

- [ ] **Step 4: Slim the route**

Route hanya memvalidasi Zod, memanggil service, memetakan hasil ke `created`/`notFound`/`badRequest`, dan menangani rate limit. Tidak ada lagi SQL di route.

- [ ] **Step 5: Add the script**

`"test:integration": "node --test \"tests/integration/*.test.ts\""`.

- [ ] **Step 6: Run tests**

Run: `npm test` (unit) dan `$env:TEST_DATABASE_URL=...; npm run test:integration`
Expected: unit hijau; integration PASS dengan DB atau SKIP tanpa DB.

- [ ] **Step 7: Verify and commit**

Run: `npx tsc --noEmit`, `npm run lint`
Lalu:

```bash
git add src/lib/rsvp-service.ts src/app/api/rsvps/route.ts tests/integration/rsvp.test.ts package.json
git commit -m "refactor(api): extract RSVP service and add integration tests"
```

---

### Task 8: Shared rate-limit store

**Files:**
- Create: `src/lib/rate-limit-store.ts`
- Modify: `src/lib/rate-limit.ts`
- Modify: `tests/rate-limit.test.ts`
- Modify: semua pemanggil `consume`/`resetRateLimit` (route rsvps, login, dan route lain yang memakai rate limit)
- Modify: `migrations/0002_indexes.sql` (tabel `rate_limits`)

**Interfaces:**
- Produces: `interface RateLimitStore { consume(key: string, options: RateLimitOptions): Promise<{ allowed: boolean; retryAfterMs: number }>; reset(key: string): Promise<void> }`
- Produces: `createMemoryStore(): RateLimitStore`
- Produces: `createPostgresStore(queryFn: (text: string, params?: unknown[]) => Promise<unknown>): RateLimitStore`
- Produces: `consume(scope: string, key: string, options?: RateLimitOptions): Promise<{ allowed: boolean; retryAfterMs: number }>`
- Produces: `resetRateLimit(scope: string, key: string): Promise<void>`
- Produces: `setRateLimitStore(store: RateLimitStore): void` (untuk test)

- [ ] **Step 1: Update the failing test** in `tests/rate-limit.test.ts`

Tambahkan test async dengan store palsu:

```ts
test("consume delegates to the configured store", async () => {
  const calls: Array<{ key: string; max: number }> = [];
  setRateLimitStore({
    async consume(key, options) {
      calls.push({ key, max: options.max });
      return { allowed: false, retryAfterMs: 1234 };
    },
    async reset() {},
  });
  const result = await consume("login", "1.2.3.4", { windowMs: 1000, max: 2 });
  assert.deepEqual(result, { allowed: false, retryAfterMs: 1234 });
  assert.deepEqual(calls, [{ key: "login:1.2.3.4", max: 2 }]);
});

test("consume falls back to memory when the store throws", async () => {
  setRateLimitStore({ async consume() { throw new Error("store down"); }, async reset() {} });
  const result = await consume("fallback", "ip", { windowMs: 1000, max: 2 });
  assert.equal(result.allowed, true);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/rate-limit.test.ts`
Expected: FAIL karena `setRateLimitStore`/async belum ada.

- [ ] **Step 3: Implement the adapter**

`MemoryStore` memakai `Map` yang sudah ada (pindahkan logika bucket + pruning). `PostgresStore` menjalankan satu statement atomik:

```sql
INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, now() + ($2 || ' milliseconds')::interval)
ON CONFLICT (key) DO UPDATE SET
  count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
  reset_at = CASE WHEN rate_limits.reset_at <= now() THEN now() + ($2 || ' milliseconds')::interval ELSE rate_limits.reset_at END
RETURNING count, reset_at;
```

`allowed` = `count <= max`. `retryAfterMs` dari selisih `reset_at`. Store dipilih dari `RATE_LIMIT_STORE` (`memory` default, `database` memakai `query` dari `db.ts`). `consume` menangkap error store, log sekali, lalu memakai `MemoryStore` sebagai fallback (fail-open terkontrol) — jangan fail-closed sampai semua request ditolak.

- [ ] **Step 4: Update callers**

Tambahkan `await` pada `consume(...)` dan `resetRateLimit(...)` di seluruh route. Cari dengan `grep -rn "consume(" src/app`.

- [ ] **Step 5: Run tests and verify**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`
Expected: hijau.

- [ ] **Step 6: Commit**

```bash
git add src/lib/rate-limit-store.ts src/lib/rate-limit.ts tests/rate-limit.test.ts src/app migrations/0002_indexes.sql
git commit -m "feat(api): support shared rate-limit store"
```

---

### Task 9: Object storage adapter and upload endpoint

**Files:**
- Create: `src/lib/sigv4.ts`
- Create: `src/lib/storage.ts`
- Create: `src/app/api/uploads/route.ts`
- Create: `src/app/api/uploads/[...path]/route.ts`
- Create: `tests/sigv4.test.ts`
- Create: `tests/storage.test.ts`
- Modify: `src/lib/validation.ts` (batas upload)
- Modify: `.gitignore` (`.data/`)

**Interfaces:**
- Produces: `signAwsRequest(input: { method: string; url: string; headers: Record<string,string>; body?: Uint8Array; region: string; service: string; accessKeyId: string; secretAccessKey: string; now?: Date }): Record<string,string>`
- Produces: `putObject(input: { key: string; body: Uint8Array; contentType: string }): Promise<{ url: string }>`
- Produces: `deleteObject(key: string): Promise<void>`
- Produces: `resolveStorageDriver(env: NodeJS.ProcessEnv): "local" | "s3"`

- [ ] **Step 1: Write the failing test** in `tests/sigv4.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { signAwsRequest } from "../src/lib/sigv4.ts";

test("signAwsRequest adds Authorization, x-amz-date, and x-amz-content-sha256", () => {
  const headers = signAwsRequest({
    method: "PUT",
    url: "https://bucket.s3.amazonaws.com/uploads/a.png",
    headers: { "content-type": "image/png" },
    body: new TextEncoder().encode("hello"),
    region: "us-east-1",
    service: "s3",
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "SECRET",
    now: new Date("2026-01-01T00:00:00Z"),
  });
  assert.match(headers.authorization, /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20260101\/us-east-1\/s3\/aws4_request/);
  assert.equal(headers["x-amz-date"], "20260101T000000Z");
  assert.equal(headers["x-amz-content-sha256"], "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
});
```

`tests/storage.test.ts`:

```ts
test("resolveStorageDriver defaults to local and accepts s3", () => {
  assert.equal(resolveStorageDriver({}), "local");
  assert.equal(resolveStorageDriver({ STORAGE_DRIVER: "s3" }), "s3");
  assert.equal(resolveStorageDriver({ STORAGE_DRIVER: "weird" }), "local");
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `node --test tests/sigv4.test.ts tests/storage.test.ts`
Expected: FAIL karena modul belum ada.

- [ ] **Step 3: Implement `src/lib/sigv4.ts`**

Implementasi SigV4 standar: canonical request, string to sign, signing key dari `HMAC` berantai, dan header hasil berisi `authorization`, `x-amz-date`, `x-amz-content-sha256`. Kunci header dinormalisasi lowercase.

- [ ] **Step 4: Implement `src/lib/storage.ts`**

`resolveStorageDriver` membaca `STORAGE_DRIVER`. Local driver menulis ke `UPLOAD_DIR` (default `.data/uploads`), membuat direktori rekursif, menolak key yang mengandung `..` atau diawali `/`, dan mengembalikan URL `/api/uploads/<key>`. S3 driver memakai `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`, dan `signAwsRequest`; jika env tidak lengkap, lempar error yang menyebut variabel yang hilang. `deleteObject` mengabaikan `ENOENT` pada local.

- [ ] **Step 5: Run tests**

Run: `node --test tests/sigv4.test.ts tests/storage.test.ts`
Expected: PASS.

- [ ] **Step 6: Implement the upload route**

`POST /api/uploads`: `requireAdmin`, baca `formData()`, ambil `file`, tolak jika bukan `File`, jika `size > 5 * 1024 * 1024`, atau `type` tidak ada di `ALLOWED_IMAGE_TYPES`. Key = `${randomUUID()}.${ext}` berdasarkan MIME. Simpan via `putObject`, kembalikan `{ url }`. Error driver -> 500 dengan pesan umum, detail hanya ke log.

`GET /api/uploads/[...path]`: hanya untuk driver local, resolve path di dalam `UPLOAD_DIR`, tolak traversal, kirim `Content-Type` dari ekstensi dan `Cache-Control: public, max-age=31536000, immutable`.

- [ ] **Step 7: Update validation and gitignore**

Ekspor `ALLOWED_IMAGE_TYPES` dari `validation.ts` jika belum ada; tambahkan `.data/` ke `.gitignore`.

- [ ] **Step 8: Verify and commit**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`

```bash
git add src/lib/sigv4.ts src/lib/storage.ts src/app/api/uploads tests/sigv4.test.ts tests/storage.test.ts src/lib/validation.ts .gitignore
git commit -m "feat(storage): add storage adapter and upload endpoint"
```

---

### Task 10: Structured logging and error reporting

**Files:**
- Create: `src/lib/logger.ts`
- Create: `tests/logger.test.ts`
- Modify: `src/lib/api-helpers.ts`
- Modify: `src/lib/db.ts`

**Interfaces:**
- Produces: `redact(value: unknown): unknown`
- Produces: `createLogger(base?: Record<string, unknown>): { info(msg: string, ctx?: Record<string, unknown>): void; warn(...): void; error(...): void }`
- Produces: `reportError(error: unknown, context?: Record<string, unknown>): void`
- Produces: `getRequestId(req: Request): string`

- [ ] **Step 1: Write the failing test** in `tests/logger.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { redact } from "../src/lib/logger.ts";

test("redact masks known secret keys recursively", () => {
  const input = { password: "p", nested: { token: "t", keep: "ok" }, list: [{ authorization: "a" }] };
  assert.deepEqual(redact(input), {
    password: "[REDACTED]",
    nested: { token: "[REDACTED]", keep: "ok" },
    list: [{ authorization: "[REDACTED]" }],
  });
});

test("redact is case-insensitive for keys", () => {
  assert.deepEqual(redact({ Cookie: "c", API_KEY: "k" }), { Cookie: "[REDACTED]", API_KEY: "[REDACTED]" });
});

test("redact leaves non-secret values untouched", () => {
  assert.equal(redact("plain"), "plain");
  assert.deepEqual(redact({ route: "/api/health", count: 2 }), { route: "/api/health", count: 2 });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/logger.test.ts`
Expected: FAIL karena modul belum ada.

- [ ] **Step 3: Implement `src/lib/logger.ts`**

Daftar kunci rahasia: `password`, `token`, `authorization`, `cookie`, `secret`, `api_key`, `apikey`. `redact` rekursif untuk object/array. Logger mencetak satu baris JSON `{ level, time, msg, ...redact(ctx) }` ke stdout/stderr. `reportError` memanggil `logger.error` dan, jika `SENTRY_DSN` diisi, mengirim POST ke endpoint store Sentry secara best-effort dengan timeout 2 detik; kegagalan kirim hanya di-log.

- [ ] **Step 4: Run tests**

Run: `node --test tests/logger.test.ts`
Expected: PASS 3/3.

- [ ] **Step 5: Integrate**

`api-helpers.error`/`serverError` memakai `createLogger({ requestId })`; `validate` meneruskan `requestId` dari header `x-request-id` atau `randomUUID()`. `db.ts` memakai logger untuk error query/pool. Jangan mengubah bentuk respons API.

- [ ] **Step 6: Verify and commit**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`

```bash
git add src/lib/logger.ts tests/logger.test.ts src/lib/api-helpers.ts src/lib/db.ts
git commit -m "feat(obs): add structured logging and error reporting"
```

---

### Task 11: CI, DB smoke test, and docker-compose

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `scripts/smoke-db.mjs`
- Create: `docker-compose.yml`
- Modify: `package.json` (script `smoke:db`)

**Interfaces:**
- Consumes: `npm run db:migrate`, `npm run test:integration`
- Produces: exit code 0 saat sukses, 2 saat `DATABASE_URL` tidak ada (dengan pesan skip).

- [ ] **Step 1: Write `docker-compose.yml`**

Postgres 16 dengan `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=clash_soccer`, port `5432:5432`, healthcheck `pg_isready`.

- [ ] **Step 2: Write `scripts/smoke-db.mjs`**

Jika `DATABASE_URL` kosong: cetak `SKIP: DATABASE_URL not set` dan `process.exit(2)`. Jika ada: jalankan migrasi (impor/eksekusi `scripts/migrate.mjs`), buat match unik, panggil `createRsvp`, assert `slots_available` turun, panggil ulang dengan WhatsApp sama dan assert `kind === "duplicate"`, assert slot tidak berubah, hapus data, cetak `SMOKE OK`. Semua kegagalan -> exit 1.

- [ ] **Step 3: Write CI workflow**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run build
        env:
          ADMIN_USERNAME: admin
          ADMIN_PASSWORD: ci-password
          ADMIN_AUTH_SECRET: ci-secret-ci-secret-ci-secret-1234
          SITE_URL: http://localhost:3000
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/clash_soccer
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: clash_soccer_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/clash_soccer_test
      TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/clash_soccer_test
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: ci-password
      ADMIN_AUTH_SECRET: ci-secret-ci-secret-ci-secret-1234
      SITE_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run test:integration
```

- [ ] **Step 4: Add script and verify**

Tambahkan `"smoke:db": "node scripts/smoke-db.mjs"`. Jalankan `node scripts/smoke-db.mjs` tanpa DB -> exit 2 dengan pesan skip. Jalankan `npm test`, `npx tsc --noEmit`, `npm run lint`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml scripts/smoke-db.mjs docker-compose.yml package.json
git commit -m "ci: add verification workflow and database smoke test"
```

---

### Task 12: Playwright E2E

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/public-pages.spec.ts`
- Create: `e2e/admin-modal.spec.ts`
- Modify: `package.json` (`test:e2e`, devDependency `@playwright/test`)
- Modify: `.gitignore` (`test-results/`, `playwright-report/`)

**Interfaces:**
- Consumes: `npm run dev` atau `npm run start` lewat `webServer`.
- Produces: `npm run test:e2e` menjalankan smoke di Chromium.

- [ ] **Step 1: Install the devDependency**

Run: `npm install --save-dev @playwright/test`
Expected: `package.json` dan lockfile berubah. Jika registry tidak tersedia, catat sebagai blocker dan lanjut ke task berikutnya tanpa commit task ini.

- [ ] **Step 2: Write `playwright.config.ts`**

`testDir: "./e2e"`, `use.baseURL = "http://127.0.0.1:3000"`, `webServer = { command: "npm run dev", url: "http://127.0.0.1:3000", reuseExistingServer: true, timeout: 120000 }`, `projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]`.

- [ ] **Step 3: Write the specs**

`public-pages.spec.ts`: kunjungi `/`, `/schedule`, `/faq`, `/contact`; assert `h1` terlihat dan tidak ada `pageerror`. `admin-modal.spec.ts`: buka `/admin`, jika diarahkan ke login maka test login dengan env CI; buka modal tambah match, tekan `Escape`, assert modal tertutup dan fokus kembali ke tombol pemicu.

- [ ] **Step 4: Add scripts and gitignore entries**

`"test:e2e": "playwright test"`. Tambahkan `test-results/`, `playwright-report/` ke `.gitignore`.

- [ ] **Step 5: Verify**

Run: `npx playwright install chromium` (jika belum), lalu `npm run test:e2e`.
Expected: PASS. Jika browser tidak bisa diunduh, laporkan skip beserta instruksi; jangan mengklaim E2E berjalan.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e package.json package-lock.json .gitignore
git commit -m "test(e2e): add Playwright smoke coverage"
```

---

### Task 13: README and operational notes

**Files:**
- Modify: `README.md`
- Modify: `.env.example` (buat jika belum ada)

**Interfaces:**
- Consumes: semua env dan script dari task sebelumnya.

- [ ] **Step 1: Tulis `.env.example`**

Daftar: `DATABASE_URL`, `TEST_DATABASE_URL` (opsional), `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` / `ADMIN_PASSWORD`, `ADMIN_AUTH_SECRET`, `SITE_URL`, `RATE_LIMIT_STORE`, `STORAGE_DRIVER`, `UPLOAD_DIR`, `S3_*`, `SENTRY_DSN`. Beri komentar mana yang wajib produksi.

- [ ] **Step 2: Tulis README**

Bagian: ringkasan, stack, prasyarat, setup (`npm install`, `.env.local`, `npm run db:migrate`, `npm run dev`), daftar script (`dev`, `build`, `start`, `lint`, `test`, `test:integration`, `test:e2e`, `db:migrate`, `db:init`, `smoke:db`, `hash-password`), arsitektur singkat (SSR publik, API, adapter), keamanan (CSP nonce, rate limit, upload, password), deployment, dan troubleshooting (DB tidak tersedia -> test skip; Playwright browser belum ada).

- [ ] **Step 3: Verify documentation commands**

Jalankan setiap script yang tidak butuh DB dan pastikan perintahnya valid: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `node scripts/migrate.mjs --status`.

- [ ] **Step 4: Commit**

```bash
git add README.md .env.example
git commit -m "docs: document setup, env, and operations"
```

---

## Self-Review Checklist

- [ ] Setiap bagian spec punya task: modal (1), password (2), env (3), SEO (4), CSP (5), migrasi (6), integration RSVP (7), rate limit (8), storage (9), observability (10), CI/smoke (11), E2E (12), README (13).
- [ ] Review Focus sudah punya test: env (task 3), password (2), CSP (5), rate limit fallback (8), upload validation (9), migrasi idempoten (6), modal (12/E2E + 1), skip infra (7/11/12).
- [ ] Nama fungsi konsisten: `nextFocusIndex`, `verifyPassword`, `validateEnv`, `buildSitemapEntries`, `buildCsp`, `selectPendingMigrations`, `createRsvp`, `RateLimitStore`, `putObject`, `redact`.
- [ ] Tidak ada step yang hanya berkata "handle edge cases" atau "add tests".
- [ ] Commit tidak menyertakan `docs/technopreneurship/**`.
