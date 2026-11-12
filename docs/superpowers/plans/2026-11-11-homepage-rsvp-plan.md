# Homepage RSVP Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membuat homepage Clash.Soccer menjadi entry point komunitas yang langsung mengarahkan pengunjung ke pertandingan berikutnya dan alur RSVP yang sudah ada.

**Architecture:** Pertahankan server-side data fetching dan route RSVP yang sekarang. Perubahan dipusatkan pada komponen presentasi homepage, match card, schedule view, dan FAQ presentation; CTA hanya meneruskan pengguna ke route detail pertandingan yang sudah tersedia.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide icons, Node test/build tooling.

**Spec:** `docs/superpowers/specs/2026-11-11-homepage-rsvp-design.md`

## Global Constraints

- Tidak mengubah schema database, API RSVP, autentikasi admin, rate limiting, capacity locking, atau validasi RSVP.
- Logo tetap menggunakan `public/logo.png`.
- Tidak menambahkan dependency atau remote image dependency.
- CTA harus mendeskripsikan tindakan: `Join this game` atau `RSVP`.
- Informasi penting tetap readable di mobile.
- Gunakan icon hanya untuk calendar, clock, location, players, dan arrow.

## Review Focus

- Tidak ada upcoming match: homepage tetap memiliki fallback ke Schedule, bukan link rusak. (Task 1)
- Sisa slot nol/penuh: UI tidak boleh menyarankan slot masih tersedia. (Task 2)
- CTA next match: harus menuju route detail untuk ID match yang tampil. (Task 1)
- Fixture panjang dan lokasi panjang di mobile: teks harus wrap tanpa overflow horizontal. (Task 2)
- FAQ tetap dapat dibaca dan dibuka setelah grouping visual. (Task 3)

---

### Task 1: Homepage hero, activity strip, dan RSVP entry point

**Files:**
- Modify: `src/components/views/home-view.tsx`
- Test: `tests/homepage-rsvp.test.ts` (jika helper pure baru dibutuhkan; tidak menambah browser test untuk markup sederhana)

**Interfaces:**
- Consumes: `nextMatch` yang sudah disediakan oleh `HomeViewProps` dan route detail match yang sudah dipakai oleh aplikasi.
- Produces: visual hero dengan next match, activity strip, dan CTA yang memakai `href={/schedule/${nextMatch.id}}`.

- [ ] **Step 1: Tinjau prop dan route match detail yang tersedia**

  Pastikan `nextMatch` dapat bernilai `null`/`undefined` dan pastikan route detail match yang dipakai oleh `MatchCard` adalah route yang benar sebelum mengubah CTA hero.

- [ ] **Step 2: Implementasikan hero copy dan next-match summary**

  Pertahankan data format existing (`formatDate`, `formatTime`). Tampilkan title, tanggal, waktu, lokasi, dan `slotsAvailable/slotsTotal`; gunakan copy lokal `A weekly football ritual in Depok.` dan CTA `Join this game` hanya ketika next match tersedia.

- [ ] **Step 3: Tambahkan fallback saat tidak ada next match**

  Tampilkan empty state singkat dan CTA menuju `/schedule`, tanpa membuat interpolasi URL dengan ID kosong.

- [ ] **Step 4: Tambahkan activity strip responsive**

  Tambahkan empat fakta ringkas: `Wednesday + Saturday`, `Depok`, `All levels welcome`, dan kapasitas pemain dari data match bila tersedia. Pastikan grid dapat berubah menjadi satu kolom/scroll-free pada mobile.

- [ ] **Step 5: Verifikasi homepage entry point**

  Jalankan `npm run lint` dan `npx tsc --noEmit`. Buka `/` di browser dan pastikan CTA next match menunjuk ke ID match yang benar serta fallback tidak menghasilkan link `/schedule/undefined`.

### Task 2: Fixture list dan RSVP CTA yang lebih mudah dipindai

**Files:**
- Modify: `src/components/match-card.tsx`
- Modify: `src/components/views/schedule-view.tsx`

**Interfaces:**
- Consumes: `MatchCard` existing `Match` model, `match.slotsAvailable`, `match.slotsTotal`, dan link detail existing.
- Produces: matchday notice/fixture component dengan status kapasitas yang jujur dan CTA yang konsisten.

- [ ] **Step 1: Tentukan state kapasitas dari model existing**

  Gunakan nilai `slotsAvailable` dan `slotsTotal` yang sudah dihitung server-side. Bedakan label `spots left`, `full`, atau status existing tanpa mengubah aturan RSVP.

- [ ] **Step 2: Rapikan hierarchy fixture**

  Susun badge/status, label Matchday, title, tanggal, waktu, lokasi, dan kapasitas dengan separator yang jelas. Pertahankan icon fungsional yang sudah ada.

- [ ] **Step 3: Tambahkan action label yang eksplisit**

  Gunakan `Open fixture` pada kartu/list dan pastikan seluruh card tetap mengarah ke detail match existing. Jangan membuat tombol palsu yang tidak memiliki handler.

- [ ] **Step 4: Sesuaikan Schedule page**

  Gunakan heading `Pick a game.` dan `The next few kick-offs`, pertahankan toggle upcoming/past, serta pastikan empty state Schedule tetap berfungsi.

- [ ] **Step 5: Verifikasi responsive dan kapasitas penuh**

  Jalankan typecheck lalu inspeksi `/schedule` pada viewport desktop dan mobile. Pastikan lokasi panjang wrap, tidak ada horizontal overflow, dan match penuh tidak diklaim masih memiliki slot.

### Task 3: Community voice, how-to-play, dan FAQ grouping presentation

**Files:**
- Modify: `src/components/views/home-view.tsx`
- Modify: `src/components/views/faq-view.tsx` atau komponen FAQ yang dipakai route `/faq`

**Interfaces:**
- Consumes: data news, albums, FAQs, dan existing accordion/state behavior.
- Produces: section community, matchday journal, three-step how-to-play, dan FAQ grouping yang tidak mengubah data model.

- [ ] **Step 1: Periksa komponen FAQ dan state accordion existing**

  Identifikasi komponen yang menangani expand/collapse. Pertahankan keyboard behavior, ARIA state, dan data yang sudah berasal dari database.

- [ ] **Step 2: Tambahkan/rapikan community statement**

  Gunakan copy lokal dan langsung, tanpa klaim statistik baru yang tidak berasal dari database.

- [ ] **Step 3: Tambahkan how-to-play section**

  Tampilkan `Choose a game → RSVP → Show up` sebagai tiga langkah visual, tetap readable di mobile dan cukup kontras pada background ink.

- [ ] **Step 4: Kelompokkan FAQ secara presentasional bila struktur data mendukung**

  Jika FAQ belum memiliki kategori, gunakan grouping visual berbasis heading statis hanya bila tidak mengubah urutan atau menghilangkan item. Jika kategori tidak aman tanpa schema change, pertahankan accordion dan perbaiki heading/copy saja.

- [ ] **Step 5: Verifikasi interaksi**

  Pastikan accordion FAQ dapat dibuka dengan mouse dan keyboard, news/gallery links tetap valid, dan section baru tidak mengganggu footer.

### Task 4: Browser, build, dan regresi publik

**Files:**
- Modify only if verification menemukan regresi pada file task sebelumnya.
- Test: existing unit/e2e commands.

- [ ] **Step 1: Jalankan unit test**

  Run: `npm test`

- [ ] **Step 2: Jalankan lint dan typecheck**

  Run: `npm run lint` dan `npx tsc --noEmit`

- [ ] **Step 3: Jalankan production build**

  Run: `npm run build`

- [ ] **Step 4: Verifikasi browser route utama**

  Periksa `/`, `/schedule`, `/gallery`, `/news`, `/faq`, `/about`, dan `/contact`. Pastikan tidak ada console error, broken image, atau horizontal overflow pada homepage dan schedule.

- [ ] **Step 5: Jalankan git diff check**

  Run: `git diff --check` dan review perubahan agar tidak ada modifikasi backend/schema di luar scope.
