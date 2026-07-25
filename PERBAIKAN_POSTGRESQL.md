# Perbaikan Error PostgreSQL - Clash.Soccer

## Masalah
Semua API mengalami error karena PostgreSQL tidak bisa diakses dengan password.

Error: `API request failed: Internal Server Error`
Penyebab: `password authentication failed for user "postgres"`

## Solusi Cepat

Jalankan perintah berikut satu per satu di terminal:

### 1. Temukan file konfigurasi PostgreSQL
```bash
sudo find /etc/postgresql -name pg_hba.conf
```

Catat lokasi file yang muncul (contoh: `/etc/postgresql/18/main/pg_hba.conf`)

### 2. Backup file konfigurasi
```bash
sudo cp /etc/postgresql/18/main/pg_hba.conf /etc/postgresql/18/main/pg_hba.conf.backup
```
*(Ganti `18` dengan versi PostgreSQL Anda)*

### 3. Edit file konfigurasi
```bash
sudo nano /etc/postgresql/18/main/pg_hba.conf
```

### 4. Cari dan ubah baris berikut:

**CARI ini:**
```
local   all             all                                     peer
```

**UBAH menjadi:**
```
local   all             all                                     md5
```

**DAN CARI ini:**
```
host    all             all             127.0.0.1/32            ident
```

**UBAH menjadi:**
```
host    all             all             127.0.0.1/32            md5
```

**ATAU jika tidak ada baris host 127.0.0.1, TAMBAHKAN ini:**
```
host    all             all             127.0.0.1/32            md5
```

Simpan file:
- Tekan `Ctrl + X`
- Tekan `Y`
- Tekan `Enter`

### 5. Set password postgres user
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### 6. Restart PostgreSQL
```bash
sudo systemctl restart postgresql
```

### 7. Verifikasi koneksi berhasil
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d clash_soccer -c "SELECT 1;"
```

Jika muncul angka `1`, berarti koneksi berhasil!

### 8. Restart Next.js development server

Tekan `Ctrl + C` di terminal yang menjalankan `npm run dev`, lalu jalankan lagi:
```bash
npm run dev
```

### 9. Buka browser dan refresh halaman

Semua error seharusnya sudah hilang!

## Verifikasi API Bekerja

Buka terminal baru dan test API:
```bash
curl http://localhost:3000/api/settings
curl http://localhost:3000/api/matches
curl http://localhost:3000/api/news
```

Semuanya harus return data JSON tanpa error.

## Troubleshooting

### Masih error setelah langkah di atas?

1. Cek status PostgreSQL:
```bash
sudo systemctl status postgresql
```

2. Cek log PostgreSQL:
```bash
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

3. Pastikan password sudah di-set:
```bash
sudo -u postgres psql -c "\du"
```

4. Pastikan pg_hba.conf sudah benar:
```bash
sudo cat /etc/postgresql/18/main/pg_hba.conf | grep -E "^(local|host)"
```

Output yang benar:
```
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

### PostgreSQL tidak bisa restart?

Cek syntax error di pg_hba.conf:
```bash
sudo -u postgres /usr/lib/postgresql/18/bin/postgres -D /var/lib/postgresql/18/main -C config_file
```

## Catatan Keamanan

Untuk production nanti:
- Ganti password 'postgres' dengan password yang lebih aman
- Update `DATABASE_URL` di `.env.local` dengan kredensial baru
- Gunakan SSL untuk koneksi database