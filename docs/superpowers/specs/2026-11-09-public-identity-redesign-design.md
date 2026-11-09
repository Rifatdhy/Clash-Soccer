# Redesign Identitas Visual Halaman Publik Clash.Soccer

Tanggal: 2026-11-09
Arah: **Crest**
Cakupan: seluruh halaman publik (beranda, jadwal, jadwal detail, galeri, galeri detail, berita, berita detail, FAQ, tentang, kontak, 404, error) plus navbar, footer, dan `layout-content.tsx`. Halaman admin tidak diubah tampilannya.

## Intent

Membuat situs Clash.Soccer terasa dibuat oleh orang yang mengenal klubnya, bukan dihasilkan template. Masalahnya bukan "kurang modern", tapi **identitas yang dibuang**: logo punya merah crest dan hijau, sementara seluruh situs memakai monokrom hitam-putih dengan Oswald uppercase dan animasi fade-up di mana-mana.

## Why

Pemeriksaan kode dan browser menemukan pola yang membuat situs terbaca generik:

1. Tujuh seksi beranda dengan ritme identik (`py-24 md:py-32`), semuanya `SectionTitle` + `SectionSubtitle` + grid + tautan "View All →". Empat tautan "View All" berbentuk sama.
2. Animasi template di semua tempat: `whileInView` fade-up di hampir setiap elemen, 15 partikel melayang di hero, overlay gradien, kotak `backdrop-blur`.
3. Palet monokrom total, sementara logo punya merah `#F70008` dan hijau `#004219` yang tidak pernah dipakai.
4. Oswald uppercase + `tracking-*` di semua judul. Ini perlakuan default untuk "sports site" buatan AI.
5. Satu komponen `Card` dengan padding identik untuk jadwal, berita, dan galeri.
6. Seksi About memakai logo di dalam kotak gradien sebagai pengganti foto.
7. Galeri memakai `object-contain` di frame 4:3, jadi foto portrait (1200x1552, 1200x1600) menghasilkan bar hitam lebar. Tinggi galeri 1697px dengan satu kartu menyisakan ruang kosong besar.
8. `PageHeader` memakai `py-32 md:py-40`, menyisakan sekitar 250px kosong di atas judul halaman.
9. Tidak ada angka yang menonjol. Slot (`17/20`) ditampilkan sebagai teks abu-abu kecil, padahal itu informasi paling penting bagi anggota.

## Goals

- Satu sistem visual yang berasal dari crest: warna, tipografi, dan motif bisa dilacak ke logo.
- Setiap halaman punya komposisi sendiri, bukan satu ritme berulang.
- Slot dan jadwal menjadi informasi utama, bukan pelengkap.
- Foto tampil tanpa letterbox: bingkai memakai `object-cover` pada rasio tetap, bukan `object-contain` di dalam frame yang tidak cocok.
- Aksesibilitas tidak turun: kontras, fokus, target sentuh, dan reduced motion dijaga.

## Non-goals

- Tidak mengubah skema database, API, atau logika RSVP.
- Tidak mengubah tampilan halaman admin. `Card` dan `Badge` dipakai bersama admin, jadi keduanya **tidak diubah**; komponen publik baru dibuat terpisah.
- Tidak menambah dependency runtime. Font baru memakai `next/font/google` yang sudah terpasang lewat `next`.
- Tidak mengganti logo, nama komunitas, atau copy yang sudah ada kecuali yang menyebut "Jakarta" padahal lokasi sebenarnya Depok.
- Tidak membuat klaim baru, angka karangan, atau testimoni.

## Anti-goals

- Merah dipakai sebagai warna dekoratif di mana-mana sampai kehilangan makna.
- Animasi baru yang bergerak saat scroll.
- Efek shader, partikel, atau gradient mesh.
- Foto stok dipakai sebagai "foto komunitas Clash.Soccer" tanpa label.

## Constraints

- `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm test` harus lolos.
- E2E yang ada mengunci teks judul: beranda `h1` harus cocok `/less talk/i`; `/schedule` `/^schedule$/i`; `/news` `/^news$/i`; `/gallery` `/^gallery$/i`; `/faq` `/^faq$/i`; `/about` `/^about$/i`; `/contact` `/^contact$/i`. Semua harus tetap berupa `h1` yang terlihat.
- `footer-ssr.spec.ts` membaca `settings.description` dari HTML awal, jadi footer tetap harus server-rendered.
- Token `@theme` di `globals.css` dipakai bersama oleh halaman publik dan admin (`Card` dan `Badge` diimpor oleh enam halaman admin). Karena admin di luar cakupan, **token lama dibekukan pada nilai sekarang** dan token baru ditambahkan terpisah; komponen publik dimigrasikan ke token baru, komponen bersama tidak disentuh.
- `layout.tsx` dipakai bersama admin: `bg-charcoal text-primary-text` dan `font-display` di `<body>`/`<html>` tidak boleh diubah. Latar dan font publik dipasang di pembungkus halaman publik, bukan di root layout.
- `font-display` (Oswald) tetap didefinisikan karena dipakai 21 tempat termasuk admin. Publik berhenti memakainya; font baru mendapat variabel sendiri.
- `public/logo.png` berukuran 1.8 MB dan berbentuk portrait (rasio 0.635), sehingga pada `h-7 w-auto` logonya hanya sekitar 25px lebar di dalam kotak 40px. Masalahnya bukan ruang kosong, melainkan orientasi mark. Perlu mark terpisah yang lebih lebar (lihat bagian Aset).
- `banner.jpg` di storage demo menampilkan stadion Buriram United dengan papan iklan Toyota dan teks Thai. Tidak boleh dipakai sebagai visual klub.
- `layout-content.tsx` membungkus setiap halaman publik dengan transisi framer-motion berbasis `pathname` yang tidak dimatikan oleh blok `prefers-reduced-motion` di `globals.css`, karena framer-motion menulis inline style, bukan animasi CSS. Ini harus ditangani eksplisit.

## Approaches

**A. Crest (dipilih).** Palet diturunkan dari logo: near-black hangat, bone, merah crest sebagai satu-satunya aksen, hijau hanya untuk status slot. Judul memakai condensed untuk angka dan tanggal, serif editorial untuk pernyataan. Jadwal menjadi fixture list, bukan tiga kartu seragam.

**B. Matchday programme.** Situs dibaca seperti program pertandingan cetak: garis rambut, small caps, jam mono, nomor halaman. Paling terasa buatan tangan, tapi lebih sedikit foto dan kaku untuk galeri.

**C. Terrace.** Fotografi dokumenter memimpin, tipografi lantang, merah satu-satunya aksen, tanpa serif. Paling hidup, tapi paling bergantung pada kualitas foto dan paling mudah jatuh ke gaya "klub bola generik".

A dipilih karena satu-satunya arah yang memakai aset yang sudah dimiliki (crest) sehingga tidak bisa ditiru situs lain, dan tetap memberi ruang untuk foto.

## Design

### 1. Palet

Nilai diambil dari sampel piksel `public/logo.png`: hitam `#000000` 40.1%, putih `#FFFFFF` 38.4%, merah `#F70008` 8.8%, hijau `#004219` 3.7%.

| Token | Nilai | Peran |
| --- | --- | --- |
| `--color-ink` | `#0C0C0D` | Latar utama. Hitam netral, bukan biru. |
| `--color-ink-raised` | `#151517` | Permukaan naik (kartu, baris jadwal). |
| `--color-ink-line` | `#2A2A2D` | Garis rambut dekoratif. Tidak pernah menjadi batas kontrol. |
| `--color-bone` | `#F2EFE9` | Teks utama. Putih hangat, bukan `#FFF` murni. |
| `--color-bone-dim` | `#A6A29B` | Teks sekunder. |
| `--color-crest` | `#C4000D` | Latar tombol utama dan bidang aksen. Teks di atasnya `bone`. |
| `--color-crest-ink` | `#FF3B3B` | Merah untuk teks dan ikon di atas `ink`. Versi terang dari crest, karena crest asli gagal kontras sebagai teks. |
| `--color-crest-hover` | `#A3000A` | Hover/pressed untuk latar tombol. |
| `--color-pitch` | `#6FB77A` | Hanya status slot tersedia, sebagai titik/ikon plus label teks. |

Semua angka di bawah dihitung dengan rumus WCAG 2.1 (relative luminance), bukan diperkirakan:

| Pasangan | Rasio | Lolos |
| --- | --- | --- |
| `bone` di atas `ink` | 17.04:1 | AAA |
| `bone` di atas `ink-raised` | 15.89:1 | AAA |
| `bone-dim` di atas `ink` | 7.69:1 | AAA |
| `bone-dim` di atas `ink-raised` | 7.18:1 | AAA |
| `crest-ink` di atas `ink` | 5.53:1 | AA teks normal |
| `crest-ink` di atas `ink-raised` | 5.16:1 | AA teks normal |
| `pitch` di atas `ink` | 8.13:1 | AAA |
| `pitch` di atas `ink-raised` | 7.58:1 | AAA |
| `bone` di atas `crest` (teks tombol) | 5.46:1 | AA teks normal |
| `crest` di atas `ink` (batas tombol, non-teks) | 3.12:1 | AA non-teks |
| `crest` di atas `ink-raised` | 2.91:1 | **Gagal** non-teks |
| `crest-ink` di atas `ink` (batas kontrol, non-teks) | 5.53:1 | AA non-teks |
| `ink-line` di atas `ink` | 1.37:1 | Dekoratif saja |

Dua konsekuensi yang mengikat implementasi:

1. **Merah crest `#E4000F` tidak boleh dipakai sebagai teks.** Rasio 4.01:1 di atas `ink`, di bawah ambang AA 4.5:1. Teks dan ikon memakai `crest-ink`; latar tombol memakai `crest` dengan teks `bone`.
2. **Batas kontrol tidak boleh memakai `crest` di atas `ink-raised`** (2.91:1) **atau `ink-line`** (1.37:1). Batas input dan tombol sekunder memakai `crest-ink` (5.16:1 di atas `ink-raised`) atau `bone-dim` (7.18:1). Garis rambut `ink-line` hanya untuk pemisah dekoratif antar baris, tidak pernah menjadi satu-satunya penanda kontrol.

Aturan pemakaian merah: maksimal satu elemen merah per layar pada 1440x900. Kalau sebuah seksi punya tombol merah, judulnya tidak boleh merah.

Token admin (`charcoal`, `surface`, `elevated`, `border`, `primary-text`, `secondary-text`, `accent`) **dibekukan** pada nilai sekarang, sehingga halaman admin tidak berubah. Token baru ditambahkan di blok `@theme` yang sama, dan komponen publik dimigrasikan ke token baru.

### 2. Tipografi

Tiga peran, tiga alasan:

| Peran | Font | Alasan |
| --- | --- | --- |
| Pernyataan | `Instrument Serif` (400, italic) | Memberi suara editorial. Kalimat seperti "Less talk. More football." dibaca sebagai pernyataan klub, bukan slogan aplikasi. Tidak dipakai untuk UI. |
| Angka & label | `Barlow Condensed` (500, 600) | Menggantikan Oswald. Condensed adalah tipografi papan skor dan nomor punggung; dipakai untuk tanggal, jam, skor, dan label kecil. |
| Teks isi | `Geist Sans` (sudah ada) | Netral dan mudah dibaca. Tidak diganti. |

Aturan: `Instrument Serif` tidak pernah uppercase. `Barlow Condensed` tidak dipakai untuk paragraf. Ukuran memakai `clamp()` supaya tidak perlu breakpoint untuk setiap ukuran.

Variabel yang dipakai:

| Variabel CSS | Font | Kelas Tailwind |
| --- | --- | --- |
| `--font-geist-sans` | Geist Sans | `font-sans` (sudah ada, tidak berubah) |
| `--font-geist-mono` | Geist Mono | `font-mono` (sudah ada, tidak berubah) |
| `--font-display` | Oswald | `font-display` (tetap ada untuk admin, publik berhenti memakainya) |
| `--font-statement` | Instrument Serif | `font-statement` (baru) |
| `--font-condensed` | Barlow Condensed | `font-condensed` (baru) |

`font-display` **tidak** dialihkan ke Barlow. Admin memakai `font-display` di beberapa tempat, jadi nilainya dipertahankan dan publik memakai dua kelas baru.

### 3. Motif identitas

Satu motif yang diulang: **garis merah 2px di bawah label seksi**, dengan label kecil condensed uppercase di atasnya. Contoh:

```
JADWAL
────────────  (garis merah 2px, lebar mengikuti label)
```

Motif ini menggantikan `SectionTitle` + `SectionSubtitle` di setiap seksi. Setiap seksi tetap punya `h2` untuk struktur heading, tapi tampilannya berbeda: label kecil + judul serif besar, bukan judul Oswald raksasa.

### 4. Komposisi per halaman

**Beranda**

1. **Hero.** `h1` tetap "LESS TALK. MORE FOOTBALL." agar E2E lolos, tapi dipecah: "Less talk." dalam serif italic, "More football." dalam condensed besar. Seluruh teks itu berada dalam **satu** `h1`. Di bawahnya satu baris fakta yang **diambil dari data**, bukan ditulis tangan: `settings.location` plus jumlah laga mendatang. Tidak ada partikel, tidak ada gradien. Latar `ink` dengan satu foto lebar di sisi kanan pada >= 1024px (`demo-album-01-cover.jpg`: bola dan sepatu di rumput, tidak ada logo klub lain). Di mobile foto menjadi pita di bawah teks.
2. **Laga berikutnya.** Blok jadwal besar: tanggal condensed, judul, jam, lokasi, dan slot sebagai angka besar dengan bar kemajuan. Ini pengganti kotak "Next Match" yang sekarang kecil dan abu-abu.
3. **Fixture list.** Tiga laga berikutnya **setelah** laga utama, yaitu `upcomingMatches.slice(1)`, supaya laga yang sama tidak tampil dua kali. Bentuknya baris, bukan kartu: tanggal | judul | lokasi | slot, dipisah garis rambut.
4. **Tentang.** Dua kolom: teks di kiri, satu foto lapangan di kanan (`demo-album-02-4.jpg`, lapangan malam dengan lampu sorot). Logo tidak lagi dipakai sebagai pengganti foto.
5. **Berita.** Satu berita utama (foto besar + judul serif) dan dua berita kecil di sampingnya. Bukan tiga kartu identik.
6. **Galeri.** Satu pita foto asimetris: satu foto lebar, dua foto sedang, dengan judul album di bawah. Tidak ada frame 4:3 dengan letterbox.
7. **FAQ.** Tiga pertanyaan sebagai daftar dengan garis rambut, jawaban terbuka (bukan akordeon di beranda).
8. **Kontak.** Satu ajakan besar dalam serif + dua tombol.

**Jadwal.** Header halaman ringkas (bukan `py-40`): label + `h1` "Schedule" + jumlah laga **di luar `h1`** agar regex `/^schedule$/i` tetap cocok. Daftar laga sebagai fixture list berkelompok per bulan. Status `ongoing` memakai label "LIVE" dengan titik merah berdenyut halus (berhenti saat reduced motion). Laga lampau di balik tombol yang sudah ada, tetap dengan `aria-expanded`.

**Jadwal detail.** Halaman ini **belum punya `h1`** saat ini (dua heading-nya `h2` di `schedule-detail-view.tsx:93` dan `:168`). Judul laga dinaikkan menjadi satu `h1`, "RSVP sent" tetap `h2`. Header memakai tanggal besar condensed, judul, dan slot. Form RSVP tetap sama secara fungsional; hanya token warna dan tipografi yang berubah. Tombol submit memakai `crest`.

**Galeri.** Header ringkas. Grid dua kolom dengan `object-cover` pada rasio tetap, sehingga tidak ada bar hitam. Foto portrait akan terpotong, dan itu diterima karena `Album` tidak menyimpan dimensi (`src/types/index.ts:23-37`) dan dokumen ini tidak menambah data. Kartu album memakai judul serif dan jumlah item kecil. `gallery/page.tsx:26` yang sekarang memakai `<p>` kosong diganti `EmptyState`.

**Galeri detail.** Lightbox dipertahankan, tetapi `div` dengan `onClick` di `gallery-detail-view.tsx:39-40` harus menjadi `<button type="button">` dengan nama aksesibel, atau `role="button"` plus `tabIndex={0}` dan handler Enter/Space. Tanpa itu halaman gagal syarat aksesibilitas dokumen ini.

**Berita.** Header ringkas. Berita pertama besar (foto 16:9 `object-cover`, judul serif), sisanya daftar baris dengan tanggal condensed.

**Berita detail.** Kolom baca `max-w-2xl`, judul serif, drop cap pada paragraf pertama. Foto `object-cover`.

**FAQ.** Sama seperti sekarang secara fungsi (pencarian + akordeon), tapi dengan garis rambut dan tipografi baru. `h1` tetap "FAQ".

**Tentang.** Header ringkas, lalu narasi dengan satu foto lapangan. `h1` tetap "About". Teks "berbasis di Jakarta" diperbaiki menjadi Depok sesuai data settings.

**Kontak.** Dua kartu kontak menjadi dua baris besar dengan label condensed dan nilai dalam serif. `h1` tetap "Contact".

**404 dan error.** Satu pernyataan serif. `error.tsx` mempertahankan tombol `reset` dan tautan beranda; `not-found.tsx` mempertahankan kedua tautannya. Keduanya tetap berfungsi, hanya berubah tampilan.

**Navbar.** Mark logo baru (lihat Aset), tautan condensed uppercase kecil, tautan aktif bergaris merah bawah. Mobile: menu layar penuh dengan tautan serif besar. Tombol menu memakai `aria-expanded` dan `aria-controls`.

**Footer.** Tiga kolom tetap, tapi dengan label condensed dan garis rambut atas. `settings.description` tetap dirender server.

### 5. Gerak

- Hero masuk sekali saat load: satu transisi opacity + translate 12px, 400ms. Tidak ada partikel.
- Tidak ada `whileInView` di mana pun. Semua konten langsung terlihat.
- Hover: kartu/baris naik 2px, foto di dalam bingkai `scale(1.02)`, tautan garis bawah tergambar, tombol turun 1px saat `:active`.
- `prefers-reduced-motion: reduce` mematikan semua transisi dan animasi, dan tidak ada konten yang tetap tersembunyi.
- Transisi halaman di `layout-content.tsx:23-33` **dihapus**, bukan hanya dibiarkan. Blok CSS reduced-motion tidak mematikannya karena framer-motion menulis inline style. Ini satu-satunya perubahan yang menyentuh berkas bersama admin, dan aman karena `layout-content.tsx` hanya membungkus halaman publik.
- Titik LIVE berdenyut dengan durasi 2.5s, berhenti saat reduced motion.

### 6. Aksesibilitas

- Setiap kontrol punya nama aksesibel; ikon `aria-hidden`.
- `:focus-visible` memakai `crest` dengan offset 3px, kontras >= 3:1 terhadap `ink` dan `bone`.
- Target sentuh minimal 44x44px di mobile, dengan jarak antar target.
- Heading tidak melompati level. Setiap halaman tepat satu `h1`.
- Gambar dekoratif `alt=""`; gambar bermakna memakai judul item.
- `cursor: pointer` pada semua kontrol aktif.
- `lang="id"` dipertahankan.

### 7. Data dan aset

- Tidak ada data baru. Semua angka diambil dari database.
- Foto hero memakai `demo-album-01-cover.jpg` (bola dan sepatu di rumput).
- Foto Tentang memakai `demo-album-02-4.jpg` (lapangan malam dengan lampu sorot).
- `banner.jpg` (stadion Buriram United) tidak dipakai di halaman publik. Karena `bannerUrl` tidak dirender di mana pun saat ini, tidak ada perubahan data yang diperlukan.
- `logo.jpg` (bola di rumput) tetap menjadi `logoUrl` untuk JSON-LD. Visual logo di navbar dan footer memakai mark baru.
- **Mark logo.** `public/logo.png` portrait dengan rasio 0.635, sehingga pada tinggi 40px lebarnya hanya ~25px. Mark baru dibuat sekali dari `logo.png`: potong ke *wordmark* "CLASH" dari crest (bagian atas berkas), sehingga rasionya lebar dan terbaca di navbar. Disimpan sebagai `public/logo-mark.png`. Kalau pemotongan wordmark tidak memuaskan secara visual, alternatifnya menampilkan hanya teks "CLASH.SOCCER" dalam `font-condensed` tanpa gambar; keputusan diambil saat implementasi dengan melihat hasilnya di browser.
- **Placeholder bersama.** `EmptyState` dan `BrandFallback` di `content-state.tsx` ikut di-restyle karena tampil di halaman publik saat data kosong atau cover tidak ada. Keduanya tidak diimpor admin (diverifikasi), jadi aman diubah.

### 8. Komponen bersama dan pemisahan admin

`Card` (`src/components/card.tsx`) dan `Badge` (`src/components/badge.tsx`) diimpor oleh enam halaman admin. Keduanya **tidak diubah**. Komponen publik baru dibuat dengan nama berbeda:

| Komponen baru | Menggantikan | Dipakai di |
| --- | --- | --- |
| `FixtureRow` | `MatchCard` | beranda, jadwal |
| `StoryCard` (utama + ringkas) | `NewsCard` | beranda, berita |
| `AlbumTile` | `GalleryCard` | beranda, galeri |
| `SectionLabel` | `SectionTitle` + `SectionSubtitle` | semua seksi publik |
| `PageHead` | `PageHeader` | semua halaman kecuali beranda |

`SectionTitle`, `SectionSubtitle`, `PageHeader`, `MatchCard`, `NewsCard`, dan `GalleryCard` dihapus setelah tidak ada pemakai. Import `motion` di `section.tsx:3` hanya dipakai kedua fungsi itu, jadi harus ikut dihapus agar `npm run lint` lolos. `Section` tetap ada dan dipakai, dengan `py-24 md:py-32` diganti skala per seksi supaya tidak seragam.

## Verification

1. `npx tsc --noEmit`, `npm run lint`, `npm test` lolos.
2. `npm run build` tanpa `DATABASE_URL` lolos.
3. `npm run test:e2e` lolos, termasuk `public-pages.spec.ts` dan `footer-ssr.spec.ts`.
4. Tangkapan layar 1440x900, 1024x768, 768x1024, dan 390x844 untuk setiap halaman publik, diperiksa satu per satu.
5. Di setiap lebar: tidak ada scroll horizontal, tidak ada elemen bertumpuk, semua gambar termuat (`naturalWidth > 0`), tidak ada console error.
6. Pemeriksaan kontras untuk setiap pasangan teks/latar yang baru.
7. `chrome-devtools` MCP dipakai untuk membaca console, network, dan DOM hasil akhir, bukan hanya screenshot.

## What is left to the builder

- Nilai tepat padding dan ukuran huruf per breakpoint, dengan syarat tidak seragam antar seksi.
- Susunan grid galeri yang konkret.
- Apakah fixture list memakai kolom tanggal tetap atau relatif.
- Apakah mark logo dari potongan wordmark memuaskan, atau diganti wordmark teks.
- Pemetaan token lama ke token baru untuk setiap komponen publik.
- Penanganan `accent-dim`/`accent-subtle` (`globals.css:11-12`): keduanya hanya dipakai di hero lama dan dihapus bersama hero tersebut, tapi tokennya tetap didefinisikan karena termasuk kelompok yang dibekukan.
