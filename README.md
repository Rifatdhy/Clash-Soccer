# ⚽ Clash.Soccer

Website komunitas mini soccer: jadwal pertandingan, RSVP, berita, galeri, dan FAQ.
Dibangun dengan **Next.js 16** (App Router, React 19) dan **PostgreSQL**.

## Fitur

- **Publik:** homepage, schedule (detail + RSVP), news, gallery, FAQ, about, contact.
  Semua halaman dirender di server (`force-dynamic`), jadi konten sudah ada di HTML
  pertama dan tetap benar saat JavaScript belum jalan.
- **Admin** (`/admin`, login): dashboard, match, RSVP, gallery (album + item),
  news, dan settings (kontak, FAQ, logo/banner).
- **API:** validasi Zod, query parameterized, envelope `{ success, data, error }`,
  dan penulisan multi-row di dalam transaksi.
- **Keamanan:** JWT httpOnly, CSP nonce, rate limiting, password scrypt,
  validasi upload, dan header keamanan di `next.config.ts` + `src/proxy.ts`.
- **Operasional:** migrasi berversi, smoke test database, integration test,
  E2E Playwright, CI GitHub Actions, dan log JSON terstruktur.

## Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, framer-motion, lucide-react |
| Database | PostgreSQL 15+, driver `pg` |
| Validasi | Zod |
| Auth | `jose` (JWT, cookie httpOnly) |
| Test | Node `node --test`, Playwright (devDependency) |

## Prasyarat

- Node.js 24 (wajib: script memakai `node --test` dengan file `.ts`)
- PostgreSQL 15+
- Docker (opsional, untuk Postgres lokal lewat `docker-compose.yml`)

## Setup Lokal

```bash
npm install
cp .env.example .env.local
# edit .env.local, minimal DATABASE_URL, ADMIN_USERNAME, ADMIN_AUTH_SECRET,
# dan salah satu ADMIN_PASSWORD / ADMIN_PASSWORD_HASH

# Opsional: jalankan Postgres lewat Docker
docker compose up -d

npm run db:migrate
npm run dev            # http://localhost:3000
```

Buat hash password admin (disarankan, menggantikan plaintext):

```bash
$env:ADMIN_PASSWORD="password-kuat"; npm run hash-password
# tempel hasilnya ke ADMIN_PASSWORD_HASH di .env.local, lalu kosongkan ADMIN_PASSWORD
```

Panduan langkah demi langkah yang lebih lama tersedia di
[CARA_RUN_PROJECT.md](./CARA_RUN_PROJECT.md); README ini adalah acuan utama
untuk env dan script terbaru.

## Environment

| Variabel | Wajib di produksi | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | Connection string PostgreSQL. Tambahkan `?sslmode=disable` untuk Postgres lokal tanpa TLS. |
| `ADMIN_USERNAME` | Ya | Username admin. |
| `ADMIN_PASSWORD_HASH` | Salah satu | Hash scrypt dari `npm run hash-password` (baca env `ADMIN_PASSWORD`). |
| `ADMIN_PASSWORD` | Salah satu | Fallback plaintext; hanya dipakai bila hash kosong. |
| `ADMIN_AUTH_SECRET` | Ya | Minimal 32 karakter acak untuk menandatangani JWT. |
| `SITE_URL` | Ya | URL absolut situs, dipakai metadata, sitemap, robots, dan JSON-LD. |
| `TEST_DATABASE_URL` | Tidak | Database untuk `npm run test:integration`; test di-skip bila kosong. |
| `RATE_LIMIT_STORE` | Tidak | `memory` (default) atau `database` untuk banyak instance. |
| `STORAGE_DRIVER` | Tidak | `local` (default) atau `s3`. |
| `UPLOAD_DIR` | Tidak | Folder upload lokal; default `.data/uploads`. |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Jika `STORAGE_DRIVER=s3` | Kredensial S3-compatible. |
| `S3_ENDPOINT` | Tidak | Endpoint kustom (mis. MinIO/R2/S3-compatible). |

| `PG_REJECT_UNAUTHORIZED`, `PG_CA_CERT` | Tidak | Pengaturan TLS untuk Postgres. |
| `SENTRY_DSN` | Tidak | Bila diisi, error dikirim best-effort ke Sentry. |

`npm run dev` dan `npm run build` tidak memerlukan database. Validasi env
berjalan saat runtime: di produksi env yang tidak lengkap menghentikan proses
dengan pesan yang menyebut nama variabel, bukan nilainya. Cek status runtime
lewat `GET /api/health` (200 sehat, 503 bila database atau config bermasalah).

## Scripts

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Build produksi. |
| `npm start` | Jalankan hasil build. |
| `npm run lint` | ESLint. |
| `npm run test` | Unit test logika murni (`node --test`). |
| `npm run test:integration` | Integration test; butuh `TEST_DATABASE_URL`. |
| `npm run test:e2e` | E2E Playwright (Chromium); menjalankan dev server otomatis. |
| `npm run db:migrate` | Jalankan migrasi yang belum diterapkan. |
| `npm run db:migrate -- --dry-run` | Tampilkan migrasi yang akan jalan. |
| `npm run db:migrate -- --status` | Tampilkan versi yang sudah diterapkan. |
| `npm run db:init` | Alias lama untuk `db:migrate`. |
| `npm run smoke:db` | Smoke test end-to-end RSVP ke database (exit 2 bila `DATABASE_URL` kosong). |
| `npm run hash-password` | Cetak `ADMIN_PASSWORD_HASH` dari env `ADMIN_PASSWORD` (atau argumen). |
| `npx tsc --noEmit` | Type check. |

## Database dan Migrasi

File migrasi ada di `migrations/` dengan format `NNNN_nama.sql`, dijalankan
berurutan dan dicatat di tabel `schema_migrations` (masing-masing dalam
transaksi). Menambah perubahan skema berarti menambah file baru, bukan
mengubah file lama.

`migrations/0001_init.sql` berisi skema awal; `migrations/0002_indexes.sql`
menambahkan indeks dan tabel `rate_limits`. `scripts/migrate.mjs` juga membaca
`.env.local`/`.env` agar bisa dijalankan tanpa shell khusus.

## Testing

```bash
npm test                  # unit, tanpa database
npm run lint
npx tsc --noEmit
npm run build

# Integration (butuh database terpisah/nyata)
$env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clash_soccer"
npm run test:integration

# E2E
npx playwright install chromium   # sekali saja
npm run test:e2e

# Smoke database (menjalankan migrasi lalu skenario RSVP)
npm run smoke:db
```

Integration test di-skip dengan pesan jelas bila `TEST_DATABASE_URL` kosong.
E2E memakai kredensial admin uji dari `playwright.config.ts`; jangan pakai
kredensial produksi.

CI (`.github/workflows/ci.yml`) menjalankan tiga job: `verify` (lint, type
check, unit test, build tanpa database), `integration` (migrasi, integration
test, `smoke:db`), dan `e2e` (migrasi, Chromium, Playwright). Kegagalan E2E
mengunggah `playwright-report/` dan `test-results/` sebagai artifact.

## Arsitektur Singkat

- `src/app/**` berisi route App Router, termasuk route API di `src/app/api/**`.
- `src/app/layout.tsx` membaca settings di server, jadi deskripsi dan tautan
  kontak di footer sudah ada di HTML pertama (bukan hasil fetch di browser).
- `src/lib/data.ts` adalah pintu baca server untuk halaman publik, dengan cache
  pendek di `src/lib/data-cache.ts`. Cache disimpan di `globalThis` supaya
  invalidasi dari route API benar-benar mengenai cache yang dibaca halaman.
- `src/lib/storage-cleanup.ts` berisi logika murni pembersihan file unggahan
  (ekstraksi key, pengecekan referensi, penentuan file yang diganti);
  `storage-cleanup-server.ts` menyambungkannya ke database dan storage nyata.
- `src/app/sitemap.ts` mendaftar halaman statis ditambah detail berita dan
  album yang ada di database.
- `src/lib/rsvp-service.ts` memegang transaksi RSVP; route hanya memvalidasi
  input dan memetakan hasil.
- `src/lib/rate-limit.ts` memilih store `memory` atau `database` lewat
  `RATE_LIMIT_STORE`. Kegagalan store bersama jatuh ke fallback in-memory agar
  API tidak ikut mati.
- `src/lib/data-cache.ts` menyimpan cache baca di `globalThis` agar route
  handler dan page berbagi satu store, dan memangkas entri kedaluwarsa begitu
  jumlahnya melewati 500 supaya slug berita/galeri yang dibuat crawler tidak
  menumpuk selamanya.
- `src/lib/storage.ts` memilih driver `local` atau `s3`; SigV4 ditandatangani
  dengan `node:crypto` tanpa SDK.
- `src/proxy.ts` melindungi `/admin` sekaligus membuat CSP nonce per request.
- `src/lib/logger.ts` menulis log JSON dengan redaksi rahasia dan menjadi titik
  integrasi Sentry.

## Keamanan

- Password admin disimpan sebagai hash scrypt (`scrypt$salt$hash`); plaintext
  lama masih diterima sampai hash dipasang.
- Semua route admin dilindungi JWT httpOnly dan dicek ulang di proxy.
- CSP memakai nonce per request; `script-src` produksi tidak memakai
  `unsafe-inline`.
- Upload dibatasi 5 MB, allowlist MIME gambar, nama file acak, dan guard path
  traversal. `Content-Length` yang sudah melebihi batas ditolak dengan 413
  sebelum body dibaca, sehingga unggahan besar tidak sempat masuk memori.
- Body JSON dibatasi 1 MB (`MAX_JSON_BODY_BYTES`). Route handler Next.js tidak
  punya batas bawaan, jadi `validate()` menolak body yang terlalu besar lewat
  header `Content-Length` sebelum `req.json()` memuatnya ke memori. Login
  melakukan rate limit lebih dulu, baru membaca body.
- File unggahan ikut dibersihkan: saat berita, album, atau item album dihapus,
  atau saat logo/banner/cover diganti, file lama dihapus hanya jika tidak ada
  baris lain yang masih memakainya. Pembersihan bersifat best-effort dan tidak
  pernah menggagalkan request yang sudah berhasil.
- `npm run db:migrate` dan `/api/db-init` memakai advisory lock PostgreSQL yang
  sama (`4829163`), jadi dua deploy bersamaan tidak menerapkan DDL yang sama
  dua kali.
- Rate limit login 5 percobaan/15 menit dan RSVP 20/15 menit per IP. Respons 429
  menyertakan header `Retry-After` (detik) supaya klien tahu kapan boleh coba
  lagi. Bila store rate limit gagal, limiter fallback ke memori dan mencatat
  peringatan alih-alih menggagalkan request.
- Rahasia (`password`, `token`, `authorization`, `cookie`, `secret`) dan data
  pribadi (`whatsapp`, `phone`, `email`, `duplicates`) diredaksi dari log. Nomor
  WhatsApp peserta RSVP tidak pernah ditulis mentah.
- 4xx dicatat sebagai `warn`, 5xx sebagai `error`, sehingga probe klien tidak
  menenggelamkan kegagalan server yang sebenarnya.
- Teks yang ditulis admin punya batas panjang (judul/slug 255, pertanyaan FAQ
  300, jawaban FAQ 3000, isi berita 100.000, ringkasan 500 karakter), dan FAQ
  menolak pertanyaan atau jawaban kosong.
- JSON-LD di-escape (`<`, `>`, `&`, U+2028/U+2029) sebelum disisipkan ke
  `<script type="application/ld+json">`, sehingga isi data tidak bisa menutup
  tag lebih awal.
- Setiap respons membawa `x-request-id` (dari proxy); error 500 mencatat id yang
  sama di log sehingga laporan pengguna bisa ditelusuri. Header masuk hanya
  dipakai bila bentuknya wajar, agar tidak bisa memalsukan baris log.

## Deployment

1. Set env produksi (lihat tabel di atas); `SITE_URL` harus URL final.
2. Jalankan `npm run db:migrate` terhadap database produksi.
3. `npm run build` lalu `npm start` (atau platform Next.js pilihan Anda).
4. Pilih `RATE_LIMIT_STORE=database` bila ada lebih dari satu instance.
5. Pastikan reverse proxy menulis `X-Real-IP` (atau `X-Forwarded-For`) di setiap
   request. Tanpa header itu semua klien berbagi satu bucket rate limit, jadi
   beberapa percobaan gagal bisa mengunci semua pengguna; aplikasi mencatat satu
   peringatan saat header tidak ada.
6. Pilih `STORAGE_DRIVER=s3` bila filesystem tidak persisten (serverless).
7. Arahkan health check ke `GET /api/health`.

Saat ini proyek belum di-deploy oleh agent; semua pemeriksaan dijalankan lokal.

## Troubleshooting

| Gejala | Penyebab dan solusi |
| --- | --- |
| `Missing admin credentials` saat login | Isi `ADMIN_USERNAME` dan salah satu `ADMIN_PASSWORD_HASH`/`ADMIN_PASSWORD`. |
| Build produksi berhenti dengan `Invalid environment configuration` | Lengkapi env wajib produksi; pesan menyebut nama variabel. |
| `/api/health` 503 | Cek `DATABASE_URL` dan migrasi; field `issues` menyebut config yang kurang. |
| Integration test skipped | Set `TEST_DATABASE_URL` ke database yang boleh dihapus datanya. |
| Playwright: browser belum ada | Jalankan `npx playwright install chromium`. |
| Upload gagal di serverless | Pakai `STORAGE_DRIVER=s3`; filesystem lokal read-only/tidak persisten. |
| File upload 404 di lokal | Pastikan `UPLOAD_DIR` dapat ditulis dan file ada di folder tersebut. |
