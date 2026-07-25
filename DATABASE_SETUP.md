# Setup Database untuk Clash.Soccer

## Prerequisites
Pastikan PostgreSQL sudah terinstall di sistem Anda.

## Langkah-langkah Setup

### 1. Install PostgreSQL (jika belum)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**MacOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download dan install dari https://www.postgresql.org/download/windows/

### 2. Start PostgreSQL Service

**Ubuntu/Debian:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**MacOS:**
```bash
brew services start postgresql@15
```

**Windows:**
PostgreSQL service akan start otomatis setelah instalasi.

### 3. Buat Database dan User

Login sebagai postgres user:
```bash
sudo -u postgres psql
```

Jalankan perintah SQL berikut:
```sql
-- Buat database
CREATE DATABASE clash_soccer;

-- Buat user (opsional, default postgres user bisa digunakan)
CREATE USER clash_admin WITH PASSWORD 'your_secure_password';

-- Berikan akses
GRANT ALL PRIVILEGES ON DATABASE clash_soccer TO clash_admin;

-- Keluar
\q
```

### 4. Konfigurasi Environment Variables

Buat file `.env.local` di root project:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clash_soccer
```

Atau jika menggunakan custom user:
```env
DATABASE_URL=postgresql://clash_admin:your_secure_password@localhost:5432/clash_soccer
```

### 5. Inisialisasi Database Schema

Jalankan development server:
```bash
npm run dev
```

Kemudian panggil endpoint inisialisasi:
```bash
curl http://localhost:3000/api/db-init
```

Atau buka di browser: `http://localhost:3000/api/db-init`

Response success:
```json
{
  "success": true,
  "message": "Database initialized successfully"
}
```

### 6. Verifikasi Setup

Cek apakah tabel sudah dibuat:
```bash
psql -U postgres -d clash_soccer -c "\dt"
```

Output harus menampilkan tabel:
- settings
- matches
- rsvps
- albums
- album_items
- news
- faqs

### 7. Test API Endpoints

```bash
# Test settings
curl http://localhost:3000/api/settings

# Test matches
curl http://localhost:3000/api/matches

# Test news
curl http://localhost:3000/api/news

# Test albums
curl http://localhost:3000/api/albums

# Test FAQs
curl http://localhost:3000/api/faqs
```

Semua endpoint harus return status 200 dengan data JSON.

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
PostgreSQL service belum running. Start service:
```bash
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # MacOS
```

### Error: "password authentication failed"
Periksa kredensial di `.env.local` atau reset password:
```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';
```

### Error: "database does not exist"
Buat database manual:
```bash
sudo -u postgres createdb clash_soccer
```

### Port 5432 already in use
Cek process yang menggunakan port:
```bash
sudo lsof -i :5432
```

## Database Schema

Schema lengkap ada di `src/lib/schema.sql`. Skema akan otomatis dibuat saat menjalankan `/api/db-init`.

## Mock Data

Data mock (matches, news, albums, FAQs) akan otomatis di-seed saat pertama kali menjalankan `/api/db-init` jika tabel masih kosong.

## Production Setup

Untuk production, gunakan managed PostgreSQL service seperti:
- **Supabase** (recommended, ada free tier)
- **Neon** (serverless PostgreSQL)
- **Railway** 
- **Vercel Postgres**

Update `DATABASE_URL` di environment variables production dengan connection string dari service tersebut.