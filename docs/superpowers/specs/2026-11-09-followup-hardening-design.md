# Follow-up Hardening — Design

Tanggal: 2026-11-09
Status: Menunggu persetujuan

## Konteks

Audit 20 temuan sudah diremediasi dan seluruh pemeriksaan hijau
(`npm test` 40/40, `tsc`, `lint`, `build`). Dokumen ini merancang
saran lanjutan yang diminta user lewat "perbaiki semuanya".

Keputusan yang sudah disetujui:

1. **Adapter + fallback lokal.** Fitur yang butuh layanan eksternal
   (Redis, object storage, Sentry, Playwright, database) diimplementasikan
   di balik adapter. Tanpa kredensial/infra, sistem memakai fallback aman
   (in-memory, no-op, local driver, skip-if-unavailable) sehingga test dan
   build tetap hijau.
2. **Runner migrasi ringan sendiri.** File SQL bernomor + tabel
   `schema_migrations`, tanpa dependency baru.
3. **Password admin:** hash `scrypt` bawaan Node, dengan fallback
   `ADMIN_PASSWORD` plaintext agar deployment lama tidak putus.
4. **Commit:** hanya file audit, dipecah menjadi beberapa commit
   terstruktur. Dokumen technopreneurship tidak disentuh dan tetap
   unstaged.

## Prinsip

- Tidak menambah dependency runtime kecuali benar-benar perlu.
- Semua logika murni baru ditulis test-first (`node --test`).
- Fitur eksternal harus punya jalur fallback dan pesan skip yang jelas.
- Tidak ada data palsu saat request gagal (aturan yang sudah berlaku).
- `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` harus
  tetap lolos setelah setiap fase.

## Fase 1 — Hardening lokal

### 1.1 Modal admin: focus trap, Escape, restore focus

- Komponen bersama `src/components/ui/modal.tsx`:
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` opsional.
  - Fokus awal ke elemen pertama yang dapat difokuskan.
  - Tab/Shift+Tab berputar di dalam modal.
  - Escape memanggil `onClose`.
  - Saat modal ditutup, fokus kembali ke pemicu.
  - Body scroll dikunci selama modal terbuka.
- Logika indeks fokus diekstrak ke fungsi murni
  `nextFocusIndex(current, total, shift)` dan dites.
- Dipakai di modal gallery, news, dan matches.

### 1.2 Validasi environment

- `src/lib/env.ts`:
  - `validateEnv(env)` mengembalikan daftar masalah bertipe
    (`missing`, `weak`, `invalid`).
  - Wajib di produksi: `DATABASE_URL`, `ADMIN_USERNAME`,
    `ADMIN_AUTH_SECRET` (minimal 32 karakter), salah satu dari
    `ADMIN_PASSWORD_HASH`/`ADMIN_PASSWORD`, dan `SITE_URL`.
  - Di development hanya menghasilkan peringatan.
- Dipanggil sekali saat startup (instrumentation/`db.ts` bootstrap) dan
  dilaporkan di `/api/health` tanpa membocorkan nilai rahasia.
- Fungsi murni dites untuk kombinasi env valid/tidak valid.

### 1.3 CSP nonce

- `middleware.ts` membuat nonce per request, menaruhnya di header
  `Content-Security-Policy`, dan mengeksposnya lewat header request
  `x-nonce` agar root layout dapat membacanya.
- Produksi: `script-src 'self' 'nonce-…' 'strict-dynamic'` tanpa
  `unsafe-inline`; `style-src` tetap `unsafe-inline` karena Tailwind.
- Development tetap mengizinkan `unsafe-eval` (React refresh).
- Header keamanan lain tetap di `next.config.ts`; CSP dihapus dari sana
  agar tidak bentrok dengan middleware.
- Verifikasi wajib di browser setelah build; jika hydration gagal,
  fallback ke CSP lama dan catat sebagai risiko.

### 1.4 Password hashing

- `src/lib/password.ts`:
  - `hashPassword(password)` -> `scrypt$<salt-b64>$<hash-b64>`
    memakai `crypto.scryptSync` dengan salt acak 16 byte.
  - `verifyPassword(password, stored)` mendukung format hash dan
    plaintext; perbandingan memakai `timingSafeEqual`.
- Login memakai `verifyPassword` terhadap `ADMIN_PASSWORD_HASH` lebih dulu,
  lalu `ADMIN_PASSWORD`.
- Script `scripts/hash-password.mjs` untuk membuat hash.
- Dites: hash valid, password salah, hash rusak, fallback plaintext.

### 1.5 SEO

- `src/app/sitemap.ts` dan `src/app/robots.ts` memakai `SITE_URL`.
- JSON-LD `SportsClub` di halaman utama.
- `metadataBase` di root layout.
- `buildSitemapEntries(baseUrl, paths)` diekstrak dan dites.

### 1.6 README

- Ringkasan proyek, stack, prasyarat, setup, daftar env (termasuk yang
  opsional), script, migrasi, test, deployment, catatan keamanan, dan
  cara menjalankan smoke/E2E.

## Fase 2 — Data dan API

### 2.1 Migrasi database

- Folder `migrations/`:
  - `0001_init.sql` — skema saat ini + seed settings.
  - `0002_indexes.sql` — indeks untuk query yang sering dipakai
    (`rsvps.match_id`, `album_items.album_id`, `news.slug` sudah unik).
- `scripts/migrate.mjs`:
  - Membuat `schema_migrations(version text primary key, applied_at timestamptz)`.
  - Menjalankan file yang belum tercatat, masing-masing dalam transaksi.
  - Mode `--dry-run` dan `--status`.
- `npm run db:migrate`.
- `scripts/init-db.mjs` tetap ada untuk kompatibilitas, tetapi memakai
  runner yang sama agar tidak ada dua sumber kebenaran.
- Logika pemilihan migrasi (`selectPendingMigrations`) diekstrak dan dites.

### 2.2 Integration test API

- Refactor minimal: pindahkan logika mutasi RSVP dari route ke
  `src/lib/rsvp-service.ts` (`createRsvp`, `deleteRsvp`) agar route dan
  test memakai kode yang sama.
- `tests/integration/rsvp.test.ts` (skip jika `TEST_DATABASE_URL` tidak ada):
  - RSVP sukses mengurangi slot.
  - Duplikat WhatsApp dalam request yang sama ditolak dan transaksi
    rollback (slot tidak berubah).
  - RSVP ke match penuh ditolak.
  - Insert news slug duplikat mengembalikan konflik.
- Setiap test memakai transaksi yang di-rollback atau data unik.

### 2.3 Rate limit multi-instance

- Ubah `rate-limit.ts` menjadi adapter:
  - `RateLimitStore` dengan `consume(key, options)` dan `reset(key)`.
  - `MemoryStore` (perilaku sekarang).
  - `PostgresStore` memakai tabel `rate_limits(key text primary key,
    count int, reset_at timestamptz)` dan `INSERT … ON CONFLICT`.
  - Dipilih lewat `RATE_LIMIT_STORE=memory|database`.
- Karena Postgres asinkron, `consume`/`resetRateLimit` menjadi async dan
  pemanggil di route diberi `await`.
- Logika window diekstrak ke fungsi murni dan dites; store palsu dipakai
  untuk test async.

### 2.4 Object storage

- `src/lib/storage.ts`:
  - `putObject({ key, body, contentType })` dan `deleteObject(key)`.
  - `LocalDriver` menulis ke `UPLOAD_DIR` (default `.data/uploads`) dan
    menyajikan lewat route `/api/uploads/[...path]`.
  - `S3Driver` memakai `fetch` + SigV4 yang ditandatangani dengan
    `node:crypto` (tanpa SDK). Dikonfigurasi lewat `S3_*` env.
- Endpoint upload admin `/api/uploads`:
  - Auth admin, batas ukuran, allowlist MIME, nama file acak.
  - Mengembalikan URL; fallback data URL dipertahankan bila driver local
    tidak tersedia (mis. serverless read-only).
- Fungsi SigV4 diekstrak dan dites dengan vektor tetap.

### 2.5 Observability

- `src/lib/logger.ts`: log JSON terstruktur (`level`, `time`, `msg`,
  `requestId`, `route`, `durationMs`, konteks aman) dengan redaksi
  `password`, `token`, `authorization`, `cookie`.
- `api-helpers` memakai logger dan meneruskan `requestId`.
- `reportError(error, context)` menjadi titik integrasi Sentry; bila
  `SENTRY_DSN` diisi, kirim via HTTP envelope; jika tidak, hanya log.
- Test fungsi redaksi dan pembentukan payload.

## Fase 3 — Verifikasi dan dokumentasi

### 3.1 CI

- `.github/workflows/ci.yml`:
  - Job `verify`: Node 24, `npm ci`, `lint`, `tsc --noEmit`, `test`, `build`.
  - Job `integration` (opsional, service Postgres): migrasi + test integrasi.
- Build tidak membutuhkan DB karena halaman publik `force-dynamic`.

### 3.2 Smoke test database

- `scripts/smoke-db.mjs`: migrasi, buat match + RSVP, cek pengurangan slot,
  cek duplikat rollback, bersihkan data, laporkan hasil.
- `docker-compose.yml` menyediakan Postgres lokal untuk smoke/integration.
- Jika Docker/DB tidak tersedia, script keluar dengan pesan skip yang jelas.

### 3.3 E2E Playwright

- `playwright.config.ts` + `e2e/*.spec.ts`:
  - Halaman publik merender konten di HTML.
  - Navigasi utama.
  - Login admin salah -> pesan error; redirect `next` hanya same-origin.
  - Modal dapat ditutup dengan Escape dan fokus kembali.
- `npm run test:e2e`. Jika browser belum terpasang, test melaporkan
  instruksi `npx playwright install`.
- `@playwright/test` ditambahkan sebagai devDependency.

### 3.4 Commit terstruktur

Urutan commit yang direncanakan:

1. `test: add pure-logic coverage for hardening helpers`
2. `feat(a11y): add focus-trapped modal`
3. `feat(security): validate env and hash admin password`
4. `feat(security): add CSP nonce middleware`
5. `feat(seo): add sitemap, robots, and structured data`
6. `feat(db): add migration runner and indexes`
7. `feat(api): share rate-limit store and RSVP service`
8. `feat(storage): add upload storage adapter`
9. `feat(obs): add structured logging and error reporting`
10. `ci: add verification workflow and DB smoke test`
11. `test(e2e): add Playwright smoke coverage`
12. `docs: add README and operational notes`

File technopreneurship dan file lain yang tidak terkait tidak dimasukkan.

## Risiko dan mitigasi

| Risiko | Mitigasi |
| --- | --- |
| CSP nonce merusak hydration | Uji di browser; sediakan fallback CSP lama dan dokumentasikan |
| Redis tidak tersedia | Default `memory`; Postgres sebagai opsi tanpa dependency baru |
| Object storage tanpa kredensial | Local driver + unit test SigV4; dokumentasi env |
| Playwright browser tidak bisa diunduh | Test mendeteksi dan memberi instruksi; CI memakai `--with-deps` |
| DB tidak tersedia | Integration/E2E/smoke skip dengan pesan jelas |
| Refactor RSVP mengubah perilaku | Test integrasi + test unit yang ada harus tetap hijau |

## Kriteria selesai

- Semua item di atas terimplementasi atau terdokumentasi sebagai skip
  yang disengaja karena infra tidak tersedia.
- Setiap logika murni baru memiliki test yang gagal sebelum implementasi.
- `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` hijau.
- README menjelaskan env wajib/opsional dan cara menjalankan semua test.
- Commit terstruktur dibuat tanpa menyertakan dokumen technopreneurship.
