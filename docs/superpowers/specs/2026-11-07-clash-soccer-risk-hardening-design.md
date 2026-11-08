# Clash.Soccer Risk Hardening Design

## Intent

Menutup risiko P0 dan P1 dari audit total, serta risiko P2 yang langsung berkaitan dengan keamanan, integritas data, aksesibilitas, dan UX error. Perubahan harus mempertahankan alur bisnis dan visual utama aplikasi.

## Goals

- Menjamin operasi database dalam transaction memakai satu PostgreSQL client.
- Mencegah penggunaan JWT secret fallback yang diketahui.
- Membuat loading, error, not-found, dan success state dapat dibedakan.
- Menjadikan lightbox, modal, menu, dan kontrol klik dapat dioperasikan dengan keyboard dan assistive technology.
- Menghubungkan semua label form dengan field yang sesuai.
- Mengganti `alert()` RSVP dengan feedback inline yang konsisten.
- Menghindari logging parameter database yang dapat memuat PII.
- Menghilangkan N+1 query album.
- Menambahkan contoh environment yang sesuai dokumentasi.
- Menambahkan test minimum untuk perilaku transaction, autentikasi, dan RSVP bila test harness dapat ditambahkan secara aman.

## Non-goals

- Tidak mengganti palette, typography, layout utama, atau brand direction.
- Tidak memigrasikan seluruh data fetching ke server components.
- Tidak menambahkan pagination untuk seluruh resource.
- Tidak mengubah kontrak API publik kecuali diperlukan untuk error/state yang benar.
- Tidak melakukan cleanup asset atau refactor luas yang tidak terkait risiko.

## Anti-goals

- Jangan menyelesaikan transaction dengan `pool.query("BEGIN")` yang terpisah-pisah.
- Jangan mempertahankan fallback secret hardcoded untuk staging/development.
- Jangan mengganti kontrol native dengan clickable `div` atau menambal aksesibilitas hanya lewat ARIA.
- Jangan menutupi error request dengan loading state permanen.

## Approaches

### A. Minimal P0/P1 patch

Memperbaiki transaction, secret, state loading, kontrol keyboard, label form, lightbox dasar, dan `.env.example`. Pendekatan ini lebih kecil, tetapi menyisakan duplikasi modal, logging sensitif, dan N+1 query.

### B. Targeted hardening, selected

Memperbaiki seluruh A, lalu menambahkan primitive dialog yang dipakai ulang, inline RSVP error, accessible names/state, pointer target dasar, redaksi logging, perbaikan N+1 query, dan test minimum. Pendekatan ini dipilih karena menutup risiko yang saling berhubungan tanpa memperluas pekerjaan menjadi redesign arsitektur.

### C. Full architecture refactor

Memindahkan data fetching publik, menambah pagination menyeluruh, membangun ulang semua form, dan menyiapkan browser test lengkap. Pendekatan ini terlalu luas untuk tujuan hardening saat ini dan meningkatkan risiko regresi.

## Design

### Database transactions

Tambahkan helper transaction pada layer database yang mengambil satu client dari pool, menjalankan callback, melakukan commit saat berhasil, rollback saat gagal, dan selalu me-release client. RSVP, album creation, dan settings update akan memakai helper ini.

### Authentication configuration

`ADMIN_AUTH_SECRET` wajib tersedia pada environment non-test. Tidak ada secret default yang tertanam di source. Dokumentasi environment diperbarui melalui `.env.example`.

### Async UI states

Halaman homepage dan detail match, album, serta news akan memakai state eksplisit untuk loading, error, not-found, dan data. Error state memiliki pesan yang dapat dipahami dan retry bila request dapat diulang.

### Accessible controls and dialogs

Kontrol yang membuka lightbox atau panel admin menggunakan elemen native. Dialog memiliki `role="dialog"`, `aria-modal`, accessible name, close button bernama, dukungan Escape, dan fokus awal yang masuk akal. Semua label form menggunakan `htmlFor` dan field `id`.

### RSVP feedback

Validasi dasar dilakukan sebelum menambah peserta. Submit error ditampilkan inline dengan `role="alert"`, bukan browser `alert()`. Server-side Zod validation tetap menjadi sumber validasi final.

### Logging and album queries

Logging database tidak akan mencetak parameter mentah. Query album diubah agar item diambil secara batch atau join, menghilangkan query per album.

## Verification

- Tambahkan dan jalankan test yang relevan dengan siklus RED-GREEN.
- Jalankan `npm run lint`.
- Jalankan `npx tsc --noEmit`.
- Jalankan `npm run build`.
- Jika browser test tidak tersedia, verifikasi kontrol/dialog melalui inspeksi kode dan catat keterbatasannya.
- Periksa `git diff` dan `git status` untuk memastikan hanya perubahan scope hardening yang dibuat.
