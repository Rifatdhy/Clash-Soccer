# ⚽ Clash.Soccer

Website komunitas mini soccer — jadwal pertandingan, RSVP, berita, galeri, dan FAQ.

Dibangun dengan **Next.js 16** + **PostgreSQL**.

## Fitur

- **Public**: Homepage, Schedule (detail + RSVP), News, Gallery, FAQ, About, Contact
- **Admin** (login): Dashboard, kelola Match, RSVP, Gallery (album + item), News, Settings (kontak, FAQ, logo/banner)
- Autentikasi admin: JWT (httpOnly cookie), proteksi route `/admin` via proxy
- API: validasi Zod, parameterized query (anti SQL-injection), envelope `{ success, data, error }`

## Persiapan

Prasyarat: Node.js 20+, PostgreSQL 15+.

```bash
npm install
cp .env.example .env.local   # lalu isi variabelnya
npm run db:init              # buat skema database
npm run dev                  # http://localhost:3000
```

Lihat [CARA_RUN_PROJECT.md](./CARA_RUN_PROJECT.md) untuk panduan lengkap (setup lokal, deploy Vercel/VPS, troubleshooting).

## Env Variables

| Variabel | Keterangan |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `ADMIN_USERNAME` | Username admin |
| `ADMIN_PASSWORD` | Password admin |
| `ADMIN_AUTH_SECRET` | Secret untuk JWT (acak, panjang) |
| `PG_REJECT_UNAUTHORIZED` | (opsional) `false` untuk self-signed cert |
| `PG_CA_CERT` | (opsional) path ke CA cert |

## Scripts

| Script | Fungsi |
|--------|--------|
| `npm run dev` | Development server |
| `npm run build` | Build production |
| `npm start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run db:init` | Inisialisasi skema database |
