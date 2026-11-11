# Clash.Soccer Technopreneurship Assignment Design

## Intent

Menyusun tugas UTS Technopreneurship berdasarkan Clash.Soccer sebagai platform digital resmi untuk satu komunitas mini soccer. Produk yang dipresentasikan adalah solusi nyata untuk masalah pengelolaan komunitas Clash.Soccer, bukan SaaS multi-komunitas dan bukan marketplace.

## Why

Pengelolaan komunitas mini soccer yang bergantung pada WhatsApp menyebabkan jadwal mudah tertimbun, pencatatan peserta manual, dokumentasi pertandingan tidak terorganisasi, dan informasi komunitas sulit ditemukan anggota baru. Clash.Soccer memusatkan informasi, jadwal, RSVP, berita, galeri, FAQ, dan kontak dalam satu website dengan dashboard admin.

## Goals

- Menjelaskan Clash.Soccer sebagai ide bisnis IT yang nyata dan relevan.
- Menghubungkan pain point, fitur aktual, target pengguna, dan model bisnis secara logis.
- Mengisi sembilan blok Business Model Canvas secara lengkap dan realistis untuk satu komunitas mini soccer.
- Menyusun materi pitching individu dengan target durasi 9 menit 15 detik sampai 9 menit 45 detik agar tidak melewati batas 10 menit.
- Memisahkan fitur yang sudah tersedia dari rencana pengembangan agar tidak ada klaim palsu.

## Non-goals

- Tidak mempresentasikan Clash.Soccer sebagai platform SaaS untuk banyak komunitas.
- Tidak mengklaim integrasi Supabase, upload object storage, export Excel native, pembayaran online, atau fitur multi-tenant sebagai fitur yang sudah berjalan.
- Tidak mengubah source code produk sebagai bagian dari tugas akademik ini.
- Tidak mengisi identitas mahasiswa dengan tebakan.

## Anti-goals

- BMC generik yang tidak berkaitan dengan fitur aktual.
- Klaim pendapatan tanpa model pembayaran yang dijelaskan.
- Slide penuh paragraf yang hanya dibaca saat presentasi.
- Menyamakan roadmap dengan fitur production.
- Menggunakan data pengguna, jumlah anggota, omzet, atau biaya yang tidak tersedia sebagai fakta.

## Chosen approach

Pendekatan A: **Clash.Soccer sebagai platform komunitas mini soccer milik sendiri.**

Clash.Soccer melayani anggota dan calon anggota satu komunitas. Admin komunitas menggunakan dashboard untuk mengelola jadwal, RSVP, berita, galeri, FAQ, dan informasi kontak. Model bisnis yang diusulkan tetap realistis untuk satu komunitas: iuran anggota/event fee, kerja sama sponsor lokal, dan paket aktivitas komunitas; angka finansial tidak akan dibuat-buat tanpa data.

## Product facts used

- Public pages: Home, About, Schedule, Schedule Detail/RSVP, Gallery, News, FAQ, Contact.
- Admin pages: Login, Dashboard, Matches, RSVP, Gallery, News, Settings.
- API dan PostgreSQL menyimpan matches, RSVP, albums, album items, news, FAQ, dan settings.
- RSVP mendukung beberapa peserta, validasi data, pengecekan slot, serta pengurangan slot pertandingan.
- Admin dapat mengekspor RSVP ke CSV.
- Authentication admin menggunakan JWT pada httpOnly cookie.
- UI mengikuti arah monokrom, premium sports, editorial, whitespace, dan animasi ringan.

## BMC decisions

1. **Customer Segments:** anggota aktif, calon anggota, pemain casual, dan admin/pengelola Clash.Soccer.
2. **Value Propositions:** pusat informasi resmi, RSVP terstruktur, slot lebih transparan, dokumentasi terorganisasi, dan citra komunitas lebih profesional.
3. **Channels:** website, tautan dari WhatsApp, Instagram, QR code di lokasi bermain, dan rekomendasi anggota.
4. **Customer Relationships:** self-service melalui website, notifikasi/pengingat berbasis informasi, bantuan admin, dan komunikasi komunitas.
5. **Revenue Streams:** biaya partisipasi/event fee, iuran komunitas, sponsorship lokal, dan aktivitas komunitas berbayar. Sumber yang belum ada di source ditandai sebagai model bisnis yang diusulkan, bukan fitur aktual.
6. **Key Activities:** pengembangan dan pemeliharaan website, pengelolaan jadwal dan RSVP, publikasi konten, dokumentasi pertandingan, serta pengelolaan relasi sponsor.
7. **Key Resources:** source code, database PostgreSQL, domain/hosting, dashboard admin, brand, konten foto/video, dan pengelola komunitas.
8. **Key Partnerships:** pengelola lapangan, sponsor lokal, fotografer/dokumentator, komunitas kampus/olahraga, dan penyedia hosting/database.
9. **Cost Structure:** hosting, database, domain, pemeliharaan teknis, pembuatan konten, dokumentasi, promosi, dan biaya operasional kegiatan.

## Presenting format

- Laporan berbahasa Indonesia.
- Slide berbahasa Indonesia.
- Cover memakai `[Nama Lengkap]` dan `[NPM]` sampai identitas diberikan.
- BMC ditampilkan dalam satu visual ringkas dan dijelaskan kembali melalui slide berikutnya.
- Pitch memakai struktur: masalah, solusi, cara kerja, pengguna, diferensiasi, BMC, kelayakan, roadmap, penutup.
- Roadmap hanya memuat pengembangan yang diberi label sebagai rencana, misalnya object storage media, export Excel native, notifikasi otomatis, dan analitik komunitas.

## Verification criteria

- Semua sembilan blok BMC terisi.
- Setiap blok punya hubungan eksplisit dengan blok lain.
- Fitur aktual dapat dilacak ke source code atau dokumentasi proyek.
- Klaim yang belum diverifikasi diberi label sebagai usulan/roadmap.
- Total bobot BMC dan penilaian tugas mengikuti brief: 20% ide, 45% BMC, 25% pitching, 10% time management.
- Materi pitching dirancang untuk maksimal 10 menit.
- Tidak ada identitas mahasiswa yang ditebak.

## Open item

Identitas mahasiswa belum diberikan. Placeholder `[Nama Lengkap]` dan `[NPM]` dipertahankan pada seluruh dokumen sampai data resmi tersedia.
