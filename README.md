# ⚽ Clash.Soccer

> Less talk. More football.

Clash.Soccer adalah website komunitas mini soccer untuk jadwal pertandingan, RSVP pemain, berita, galeri, FAQ, dan informasi kontak. Website publik membaca data dari server, sementara admin mengelola konten melalui panel yang dilindungi autentikasi.

Dibangun dengan **Next.js 16 App Router**, **React 19**, **TypeScript**, dan **PostgreSQL**.

<p>
  <a href="#fitur">Fitur</a> ·
  <a href="#memulai">Memulai</a> ·
  <a href="#perintah">Perintah</a> ·
  <a href="#arsitektur">Arsitektur</a> ·
  <a href="#deployment">Deployment</a>
</p>

## Daftar isi

- [Fitur](#fitur)
- [Stack](#stack)
- [Prasyarat](#prasyarat)
- [Memulai](#memulai)
- [Environment variables](#environment-variables)
- [Perintah](#perintah)
- [Database dan migrasi](#database-dan-migrasi)
- [Data demo](#data-demo)
- [Testing](#testing)
- [Arsitektur](#arsitektur)
- [Keamanan dan operasional](#keamanan-dan-operasional)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Fitur

### Untuk komunitas

- Homepage dengan pertandingan berikutnya, jadwal terdekat, berita terbaru, galeri, dan FAQ.
- Schedule dengan detail pertandingan dan RSVP pemain.
- News dengan halaman detail berdasarkan slug.
- Gallery berbasis album, termasuk album yang mengarah ke Google Drive.
- About dan contact yang mengambil informasi komunitas dari settings.
- Sitemap, robots, metadata, dan JSON-LD untuk halaman publik.

### Untuk admin

- Dashboard admin di `/admin`.
- Pengelolaan matches, RSVP, news, album gallery, item gallery, FAQ, dan settings.
- Upload logo, banner, cover, dan foto melalui local storage atau S3-compatible storage.
- Cache data publik yang di-invalidasi setelah perubahan admin.

### Untuk developer

- API route dengan validasi Zod dan response envelope yang konsisten.
- Query PostgreSQL terparameterisasi.
- Migrasi database berversi dengan advisory lock.
- Unit test, integration test, smoke test database, dan E2E test Playwright.
- CI GitHub Actions untuk lint, type check, test, build, integration, dan E2E.

## Stack

| Area | Teknologi |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| UI | `framer-motion`, `lucide-react` |
| Database | PostgreSQL 15+ melalui `pg` |
| Validasi | Zod |
| Auth | JWT melalui `jose`, disimpan di `httpOnly` cookie |
| Image processing | `sharp` |
| Testing | Node test runner, Playwright Chromium |
| CI | GitHub Actions |

## Prasyarat

- Node.js 24.
- PostgreSQL 15 atau lebih baru.
- Docker Desktop, opsional untuk PostgreSQL lokal.
- Chromium Playwright untuk E2E test.

## Memulai

### 1. Install dependency

```bash
npm ci
```

### 2. Siapkan environment

Linux/macOS:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Isi minimal `.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clash_soccer"
ADMIN_USERNAME="admin"
ADMIN_AUTH_SECRET="ganti-dengan-secret-minimal-32-karakter"
ADMIN_PASSWORD="password-lokal"
SITE_URL="http://localhost:3000"
```

Untuk PostgreSQL lokal tanpa TLS, tambahkan `?sslmode=disable` pada `DATABASE_URL`.

### 3. Jalankan PostgreSQL

```bash
docker compose up -d
```

Atau gunakan PostgreSQL yang sudah berjalan dan sesuaikan `DATABASE_URL`.

### 4. Jalankan migrasi dan data demo

```bash
npm run db:migrate
npm run seed:demo
```

Seed demo opsional, tetapi membantu saat memeriksa tampilan secara manual.

### 5. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

> `npm run build` tidak membutuhkan database karena validasi build melewati akses database. Halaman yang membaca data tetap membutuhkan database saat runtime.

## Environment variables

Salin `.env.example` untuk template lengkap. Variabel penting:

| Variabel | Wajib production | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | Connection string PostgreSQL. Gunakan `?sslmode=disable` untuk Postgres lokal tanpa TLS. |
| `ADMIN_USERNAME` | Ya | Username panel admin. |
| `ADMIN_AUTH_SECRET` | Ya | Secret JWT minimal 32 karakter acak. |
| `ADMIN_PASSWORD_HASH` | Disarankan | Hash scrypt untuk password admin. |
| `ADMIN_PASSWORD` | Fallback | Dipakai bila hash belum tersedia. |
| `SITE_URL` | Ya | URL absolut untuk metadata, sitemap, robots, dan JSON-LD. |
| `TEST_DATABASE_URL` | Integration test | Database terpisah yang boleh diubah oleh test. |
| `RATE_LIMIT_STORE` | Tidak | `memory` sebagai default atau `database` untuk multi-instance. |
| `STORAGE_DRIVER` | Tidak | `local` sebagai default atau `s3`. |
| `UPLOAD_DIR` | Tidak | Folder upload lokal; default `.data/uploads`. |
| `S3_BUCKET`, `S3_REGION`, kredensial S3 | Jika memakai S3 | Konfigurasi S3-compatible storage. |
| `S3_ENDPOINT` | Tidak | Endpoint custom seperti MinIO, R2, atau provider S3-compatible. |
| `SENTRY_DSN` | Tidak | Error dikirim best-effort ke Sentry bila diisi. |

### Membuat password hash

Gunakan environment variable agar password tidak masuk shell history.

PowerShell:

```powershell
$env:ADMIN_PASSWORD="password-kuat"; npm run hash-password
```

Linux/macOS:

```bash
ADMIN_PASSWORD="password-kuat" npm run hash-password
```

Salin output `ADMIN_PASSWORD_HASH=...` ke `.env.local`, lalu hapus `ADMIN_PASSWORD` dari production.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Production build. |
| `npm run start` | Menjalankan production build. |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | TypeScript check. |
| `npm test` | Seluruh unit test. |
| `node --test tests/<name>.test.ts` | Satu unit test file. |
| `npm run test:integration` | Integration test dengan `TEST_DATABASE_URL`. |
| `npm run test:e2e` | E2E test Playwright Chromium. |
| `npm run db:migrate` | Migrasi yang belum diterapkan. |
| `npm run db:migrate -- --dry-run` | Migrasi yang akan dijalankan. |
| `npm run db:migrate -- --status` | Status migrasi. |
| `npm run db:init` | Alias kompatibilitas untuk `db:migrate`. |
| `npm run seed:demo` | Data demo. |
| `npm run seed:demo -- --reset` | Reset lalu isi ulang data demo. |
| `npm run smoke:db` | Smoke test RSVP terhadap database. |
| `npm run hash-password` | Membuat `ADMIN_PASSWORD_HASH`. |
| `npm run logo:mark` | Script utilitas logo mark. |

## Database dan migrasi

Migration berada di `migrations/` dengan format `NNNN_name.sql` dan dijalankan berurutan. Versi yang sudah diterapkan dicatat di `schema_migrations`.

Aturan penting:

1. Jangan mengubah migration file yang sudah diterapkan.
2. Tambahkan file migration baru untuk perubahan schema.
3. `npm run db:migrate` dan `/api/db-init` memakai advisory lock PostgreSQL `4829163`.
4. Integration test harus memakai database yang terpisah dari development dan production.

## Data demo

```bash
npm run seed:demo
npm run seed:demo -- --reset
```

Seed memakai prefix ID `demo-`, sehingga `--reset` hanya menghapus data demo. Data mencakup pertandingan, RSVP, album, foto, berita, FAQ, dan settings.

Gambar demo disimpan melalui storage driver aktif dan diakses lewat `/api/uploads/demo/...`. Cache gambar ada di `.data/demo-images/` dan tidak ikut di-commit.

## Testing

### Verifikasi lokal

Jalankan secara serial agar build dan E2E tidak berebut folder `.next`:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:e2e
```

### Integration test

```powershell
$env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clash_soccer_test"
npm run db:migrate
npm run test:integration
```

Integration test dilewati bila `TEST_DATABASE_URL` kosong.

### E2E test

Install browser satu kali:

```bash
npx playwright install chromium
```

`playwright.config.ts` memakai satu worker, server `127.0.0.1:3000`, dan kredensial admin E2E. Di luar CI, Playwright memakai `reuseExistingServer`; hentikan server manual pada port 3000 agar test tidak memakai `.env.local` atau credential yang salah.

Jangan menjalankan `npm run build` bersamaan dengan E2E karena keduanya memodifikasi `.next`. Jika generated types atau cache Turbopack korup, hentikan dev server lalu hapus `.next` sebelum mengulang secara serial.

## Arsitektur

```text
src/
  app/           App Router pages, layouts, metadata, dan API routes
  components/   Komponen UI dan view publik/admin
  lib/           Data access, auth, cache, storage, validation, logging
  types/         Shared TypeScript types
migrations/     Migration PostgreSQL berurutan
scripts/        Migration, seed, smoke test, password, dan utilitas
tests/          Unit test dan integration test
e2e/            Playwright browser test
```

Boundary penting:

- `src/lib/data.ts` adalah pintu baca server untuk halaman publik. Cache disimpan di `globalThis` melalui `src/lib/data-cache.ts` agar page dan route handler berbagi store yang sama.
- Setiap route write harus memanggil `invalidateDataCache()` setelah berhasil mengubah data.
- `src/lib/rsvp-service.ts` mengubah RSVP dalam transaksi dan mengunci row match dengan `FOR UPDATE`.
- `src/proxy.ts` melindungi `/admin/**`, membuat CSP nonce, dan menambahkan `x-request-id`. Route handler tetap memanggil `requireAdmin()`.
- `src/lib/storage.ts` mendukung local dan S3 driver, tetapi URL upload publik selalu melalui `/api/uploads/<key>`.
- Upload diverifikasi berdasarkan file signature lalu dinormalisasi dengan `sharp`. Route upload harus tetap di Node runtime, bukan Edge runtime.

## Keamanan dan operasional

- API memakai envelope `{ success: true, data, error: null }` atau `{ success: false, error, data: null }`.
- Validasi route menggunakan schema Zod melalui `validate()` di `src/lib/api-helpers.ts`.
- Gunakan `createLogger()` dari `src/lib/logger.ts`; jangan menambahkan `console.log`, `console.warn`, atau `console.error` langsung di route atau library server.
- Session admin adalah JWT `httpOnly` cookie dan tidak boleh dimanipulasi dari client JavaScript.
- Upload memiliki batas ukuran, allowlist gambar, random key, dan guard path traversal.
- Penghapusan atau penggantian referensi gambar harus memakai helper storage cleanup.
- Rate limit login adalah 5 percobaan per 15 menit dan RSVP 20 percobaan per 15 menit per IP. Response `429` menyertakan `Retry-After`.

## Deployment

1. Isi environment production, terutama `DATABASE_URL`, `ADMIN_AUTH_SECRET`, `SITE_URL`, dan kredensial admin.
2. Jalankan `npm run db:migrate` terhadap database production.
3. Jalankan `npm run build`.
4. Jalankan `npm run start` atau platform Next.js yang digunakan.
5. Gunakan `RATE_LIMIT_STORE=database` untuk lebih dari satu instance.
6. Gunakan `STORAGE_DRIVER=s3` bila filesystem tidak persisten atau read-only.
7. Pastikan reverse proxy meneruskan `X-Real-IP` atau `X-Forwarded-For`.
8. Arahkan health check ke `GET /api/health`.

CI di `.github/workflows/ci.yml` menjalankan verification (`lint`, type check, unit test, build), integration (`migrate`, integration test, smoke test), dan E2E (Chromium + Playwright).

## Troubleshooting

| Gejala | Solusi |
| --- | --- |
| `Missing admin credentials` | Isi `ADMIN_USERNAME` dan `ADMIN_PASSWORD_HASH` atau `ADMIN_PASSWORD`. |
| Build menolak environment | Lengkapi environment production yang wajib. |
| `/api/health` mengembalikan `503` | Periksa `DATABASE_URL`, PostgreSQL, dan migration status. |
| Integration test di-skip | Set `TEST_DATABASE_URL` ke database test disposable. |
| Playwright tidak menemukan browser | Jalankan `npx playwright install chromium`. |
| Admin E2E timeout atau gagal login | Hentikan server port 3000, lalu jalankan `npm run test:e2e` lagi. |
| Generated `.next` types/cache rusak | Hentikan dev server, hapus `.next`, lalu build dan E2E secara serial. |
| Upload 404 di lokal | Pastikan `UPLOAD_DIR` dapat ditulis dan file tersedia. |
| Upload gagal di serverless | Gunakan `STORAGE_DRIVER=s3` karena filesystem lokal bisa read-only atau tidak persisten. |

## Status proyek

Pemeriksaan dan deployment dilakukan secara lokal melalui script di repository. Target deployment dapat menggunakan platform Next.js pilihan selama environment, migrasi database, storage, dan health check dikonfigurasi sesuai bagian di atas.
