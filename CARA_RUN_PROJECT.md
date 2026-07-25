# 🚀 Cara Menjalankan Project Clash.Soccer

## Pilihan 1: Quick Start (Tanpa Database)

Cara tercepat untuk menjalankan dan melihat aplikasi:

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev
```

Buka browser: **http://localhost:3000**

✅ **App akan langsung berfungsi!**
- Homepage dengan data fallback
- Semua halaman dapat diakses
- UI/UX sudah lengkap dan responsive
- Animasi sudah berfungsi

⚠️ **Limitasi Mode Ini:**
- Data masih mock/fallback (tidak persisten)
- Admin CRUD tidak berfungsi (hanya bisa lihat)
- RSVP tidak tersimpan

---

## Pilihan 2: Full Setup (Dengan Database)

Untuk mendapatkan full functionality dengan database PostgreSQL:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**MacOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download dari https://www.postgresql.org/download/windows/

### Step 3: Buat Database

```bash
# Login sebagai postgres user
sudo -u postgres psql

# Di dalam psql prompt, jalankan:
CREATE DATABASE clash_soccer;

# Keluar dari psql
\q
```

### Step 4: Setup Environment Variables

```bash
# Copy template
cp .env.local.example .env.local
```

Edit file `.env.local`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clash_soccer
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ubah_password_ini
```

### Step 5: Jalankan Development Server

```bash
npm run dev
```

### Step 6: Initialize Database

Buka browser baru atau gunakan curl:

**Option A - Via Browser:**
Buka: http://localhost:3000/api/db-init

**Option B - Via Terminal:**
```bash
curl http://localhost:3000/api/db-init
```

Anda akan melihat response:
```json
{
  "success": true,
  "message": "Database initialized successfully"
}
```

### Step 7: Test Login Admin

1. Buka http://localhost:3000/admin/login
2. Login dengan:
   - Username: `admin` (atau sesuai yang di .env.local)
   - Password: `ubah_password_ini` (atau sesuai yang di .env.local)

✅ **Sekarang semua fitur berfungsi penuh!**

---

## Troubleshooting

### Error: "Cannot find module"
```bash
# Hapus node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 already in use"
```bash
# Ubah port
npm run dev -- -p 3001
```

### Error: "connect ECONNREFUSED" (Database)
```bash
# Pastikan PostgreSQL running
sudo systemctl status postgresql

# Jika tidak running, start dulu
sudo systemctl start postgresql
```

### Error: "database does not exist"
```bash
# Buat database manual
sudo -u postgres createdb clash_soccer
```

### Error: "password authentication failed"
```bash
# Reset password postgres
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
\q

# Update DATABASE_URL di .env.local dengan password baru
```

---

## Perintah Berguna

### Development
```bash
# Run dev server
npm run dev

# Build untuk production
npm run build

# Run production build
npm start

# Check linting
npm run lint
```

### Database
```bash
# Cek koneksi database
psql -U postgres -d clash_soccer -c "\dt"

# Reset database (hati-hati!)
sudo -u postgres psql
DROP DATABASE clash_soccer;
CREATE DATABASE clash_soccer;
\q

# Initialize ulang
curl http://localhost:3000/api/db-init
```

### Git
```bash
# Commit changes
git add .
git commit -m "Your message"
git push origin main
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
│   ├── app/              # Pages & routing
│   │   ├── page.tsx      # Homepage
│   │   ├── admin/        # Admin pages
│   │   ├── about/        # Public pages
│   │   └── api/          # API routes
│   ├── components/       # Reusable components
│   ├── lib/              # Utilities & stores
│   └── data/             # Types & mock data
├── public/               # Static assets
├── .env.local           # Environment variables (create this)
├── package.json          # Dependencies
└── tailwind.config.ts    # Tailwind configuration
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run dev server | `npm run dev` |
| Build production | `npm run build` |
| Start production | `npm start` |
| Initialize database | `curl http://localhost:3000/api/db-init` |
| Check database | `psql -U postgres -d clash_soccer` |

---

## Support

Jika masih ada masalah:
1. Pastikan Node.js versi 18+ terinstall: `node --version`
2. Pastikan npm terinstall: `npm --version`
3. Check error di console browser (F12 → Console)
4. Check error di terminal tempat `npm run dev` berjalan

Happy coding! ⚽️