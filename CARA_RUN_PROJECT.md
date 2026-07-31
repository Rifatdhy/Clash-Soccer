# 🚀 Cara Menjalankan Project Clash.Soccer

> ⚠️ **Penting:** Aplikasi ini **wajib menggunakan PostgreSQL**. Tidak ada mode mock/fallback lagi — data diambil langsung dari database.

## Prasyarat

- Node.js 20+ (lihat `.nvmrc`)
- PostgreSQL 15+

## Setup Lokal

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
# Copy template
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clash_soccer
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ganti-dengan-password-kuat
ADMIN_AUTH_SECRET=ganti-dengan-string-acak-panjang
```

Generate secret acak: `openssl rand -base64 48`

### Step 3: Buat Database
```bash
sudo -u postgres psql -c "CREATE DATABASE clash_soccer;"
```

### Step 4: Inisialisasi Skema Database
```bash
npm run db:init
```

### Step 5: Jalankan Development Server
```bash
npm run dev
```

Buka http://localhost:3000 — semua fitur (public + admin) berfungsi penuh.

---

## Deploy Production

### Opsi A: Vercel + Neon/Supabase (disarankan)
1. Push repo ke GitHub
2. Import di Vercel (auto-deteksi Next.js)
3. Buat database di Neon/Supabase, salin connection string
4. Set environment variables di Vercel:
   - `DATABASE_URL` (dari Neon/Supabase, biasanya sudah `?sslmode=require`)
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_AUTH_SECRET`
5. Jalankan `npm run db:init` dengan env produksi (secara lokal dengan DATABASE_URL produksi)

### Opsi B: VPS
- Setup Node 20+, PostgreSQL, reverse proxy (Nginx/Caddy) + HTTPS
- PostgreSQL tanpa SSL: tambahkan `?sslmode=disable` di akhir `DATABASE_URL`, atau set `PG_REJECT_UNAUTHORIZED=false` untuk self-signed cert

---

## Perintah Berguna

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run dev server | `npm run dev` |
| Build production | `npm run build` |
| Start production | `npm start` |
| Initialize database | `npm run db:init` |
| Check linting | `npm run lint` |
| Type check | `npx tsc --noEmit` |

---

## Troubleshooting

### Error koneksi DB di mode produksi ("self-signed certificate")
PostgreSQL lokal tanpa SSL ditolak karena mode produksi mengaktifkan SSL.
- VPS: tambahkan `?sslmode=disable` di `DATABASE_URL` atau set `PG_REJECT_UNAUTHORIZED=false`
- Cloud (Neon/Supabase): tidak perlu, sertifikat valid

### Error: "Port 3000 already in use"
```bash
npm run dev -- -p 3001
```

### Error: "database does not exist"
```bash
sudo -u postgres createdb clash_soccer
npm run db:init
```

---

## Testing Fitur

### Public Pages (Tanpa Login)
- Homepage: http://localhost:3000
- About: http://localhost:3000/about
- Contact: http://localhost:3000/contact
- FAQ: http://localhost:3000/faq
- Schedule: http://localhost:3000/schedule
- Gallery: http://localhost:3000/gallery
- News: http://localhost:3000/news

### Admin Pages (Perlu Login)
- Login: http://localhost:3000/admin/login
- Dashboard: http://localhost:3000/admin
- Matches: http://localhost:3000/admin/matches
- RSVP: http://localhost:3000/admin/rsvp
- Gallery: http://localhost:3000/admin/gallery
- News: http://localhost:3000/admin/news
- Settings: http://localhost:3000/admin/settings

---

## Structure Overview

```
clash-soccer/
├── src/
│   ├── app/              # Pages, routing & API routes
│   │   ├── page.tsx      # Homepage
│   │   ├── admin/        # Admin pages
│   │   ├── about/        # Public pages
│   │   └── api/          # API routes
│   ├── components/       # Reusable components
│   ├── lib/              # Utilities, stores & DB helpers
│   └── proxy.ts          # Route protection (/admin)
├── public/               # Static assets
├── scripts/              # CLI scripts (init-db)
├── .env.local            # Environment variables (create this)
└── package.json          # Dependencies
```

Happy coding! ⚽️
