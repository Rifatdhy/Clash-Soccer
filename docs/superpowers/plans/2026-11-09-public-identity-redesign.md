# Redesign Identitas Visual Halaman Publik Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti tampilan generik halaman publik Clash.Soccer dengan sistem visual "Crest" yang diturunkan dari logo, tanpa mengubah halaman admin, data, atau API.

**Architecture:** Token warna dan font baru ditambahkan di `@theme` bersama token lama yang dibekukan untuk admin. Logika tata letak murni (pengelompokan per bulan, status slot, penyaringan laga) diekstrak ke `src/lib/schedule-layout.ts` supaya bisa diuji tanpa DOM. Komponen publik baru dibuat terpisah dari `Card`/`Badge` yang dipakai bersama admin, lalu komponen publik lama dihapus setelah tidak ada pemakai.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4 (`@theme inline`), `next/font/google`, framer-motion (hanya untuk animasi masuk hero), Node test runner (`node --test`), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-09-public-identity-redesign-design.md`

## Global Constraints

- `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm test` harus lolos di setiap task.
- Jangan menambah dependency runtime. `sharp` sudah ada sebagai devDependency dan hanya boleh dipakai oleh skrip sekali jalan.
- Jangan mengubah `src/app/admin/**`, `src/components/admin-shell.tsx`, `src/components/card.tsx`, `src/components/badge.tsx`, `src/app/api/**`, `src/lib/db.ts`, atau skema database.
- Jangan mengubah `bg-charcoal text-primary-text` dan `font-display` di `src/app/layout.tsx` bagian `<html>`/`<body>`; admin memakainya.
- Token lama (`charcoal`, `surface`, `elevated`, `border`, `primary-text`, `secondary-text`, `accent`, `accent-dim`, `accent-subtle`) dibekukan pada nilai sekarang. Token baru ditambahkan, bukan menggantikan.
- Kontras: `crest-ink` `#FF3B3B` untuk teks/ikon di atas `ink`; `crest` `#C4000D` hanya untuk latar tombol dengan teks `bone`; `ink-line` `#2A2A2D` hanya untuk pemisah dekoratif, tidak pernah menjadi batas kontrol.
- Tidak ada `whileInView`, fade-up, partikel, gradien dekoratif, atau animasi yang dipicu scroll.
- Setiap halaman publik tepat satu `h1`. `/schedule/[id]` saat ini tidak punya `h1` dan harus mendapatkannya.
- Teks judul yang dikunci E2E: beranda `/less talk/i`, `/schedule` `/^schedule$/i`, `/news` `/^news$/i`, `/gallery` `/^gallery$/i`, `/faq` `/^faq$/i`, `/about` `/^about$/i`, `/contact` `/^contact$/i`. Jumlah atau label tambahan tidak boleh masuk ke dalam elemen `h1`.
- Footer tetap server-rendered dan tetap memuat `settings.description`.
- Copy tidak boleh mengarang fakta. Hari bermain tidak ada di database; jangan menuliskannya. Lokasi memakai `settings.location`.
- Tidak memakai `banner.jpg` (stadion Buriram United) sebagai visual.
- Commit per task, pesan gaya `feat(design): ...` / `refactor(design): ...`.

## Review Focus

1. **Data kosong.** `/schedule`, `/news`, `/gallery` dengan nol baris harus menampilkan `EmptyState`, bukan grid kosong atau teks telanjang.
2. **Cover gambar tidak ada.** `Album.coverUrl` atau `NewsItem.coverImage` kosong harus menampilkan `BrandFallback`, bukan kotak kosong atau `img` rusak.
3. **Laga `ongoing`.** Laga berstatus `ongoing` harus tetap muncul di daftar mendatang dengan label LIVE, tidak hilang seperti bug yang sudah diperbaiki.
4. **Laga yang sama dua kali.** Laga utama beranda tidak boleh muncul lagi di fixture list di bawahnya.
5. **Gambar gagal dimuat.** URL gambar yang 404 atau bukan gambar tidak boleh merusak tata letak; bingkai harus tetap punya ukuran.

---

### Task 1: Token desain dan font

**Files:**
- Modify: `src/app/globals.css:3-17` (blok `@theme inline`), `src/app/globals.css:62-76`
- Modify: `src/app/layout.tsx:2`, `src/app/layout.tsx:10-23`, `src/app/layout.tsx:67`
- Test: tidak ada test unit; diverifikasi lewat `npm run build` dan pemeriksaan browser.

**Interfaces:**
- Produces: kelas Tailwind `bg-ink`, `bg-ink-raised`, `border-ink-line`, `text-bone`, `text-bone-dim`, `text-crest`, `bg-crest`, `text-crest-ink`, `border-crest`, `text-pitch`, `bg-pitch`, `font-statement`, `font-condensed`. Dipakai semua task berikutnya.
- Produces: variabel `--font-instrument-serif` dan `--font-barlow-condensed` pada `<html>`.

- [ ] **Step 1: Tambahkan dua font di `layout.tsx`**

Impor `Instrument_Serif` dan `Barlow_Condensed` dari `next/font/google`. `Instrument_Serif` dengan `weight: "400"`, `style: ["normal", "italic"]`, `subsets: ["latin"]`, `variable: "--font-instrument-serif"`. `Barlow_Condensed` dengan `weight: ["500", "600"]`, `subsets: ["latin"]`, `variable: "--font-barlow-condensed"`. Tambahkan kedua `variable` ke `className` pada `<html>`, di samping `geistSans.variable`, `geistMono.variable`, dan `oswald.variable` yang sudah ada. Jangan mengubah `oswald`.

- [ ] **Step 2: Tambahkan token baru di `globals.css`**

Di dalam blok `@theme inline` yang sudah ada, tambahkan setelah token lama (jangan menghapus atau mengubah token lama):

```css
  --color-ink: #0C0C0D;
  --color-ink-raised: #151517;
  --color-ink-line: #2A2A2D;
  --color-bone: #F2EFE9;
  --color-bone-dim: #A6A29B;
  --color-crest: #C4000D;
  --color-crest-ink: #FF3B3B;
  --color-crest-hover: #A3000A;
  --color-pitch: #6FB77A;

  --font-statement: var(--font-instrument-serif);
  --font-condensed: var(--font-barlow-condensed);
```

- [ ] **Step 3: Ganti blok animasi lama dengan utilitas gerak baru**

Hapus `@keyframes fade-in`, `fade-up`, `pulse-subtle`, dan kelas `.animate-fade-in`, `.animate-fade-up`, `.animate-pulse-subtle` (tidak dipakai di mana pun, diverifikasi dengan grep). Ganti dengan:

```css
@keyframes hero-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.hero-enter {
  animation: hero-enter 400ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

.live-pulse {
  animation: live-pulse 2.5s ease-in-out infinite;
}
```

- [ ] **Step 4: Perketat blok reduced motion**

Di `@media (prefers-reduced-motion: reduce)`, tambahkan `animation: none !important;` pada selector `*` yang sudah ada, di samping properti yang sudah ada. Tambahkan juga `.live-pulse { animation: none !important; opacity: 1; }` agar titik LIVE berhenti berdenyut dan tetap terlihat.

- [ ] **Step 5: Verifikasi build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: ketiganya lolos tanpa error. Build boleh tanpa `DATABASE_URL`.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat(design): add crest palette and display fonts"
```

---

### Task 2: Mark logo

**Files:**
- Create: `scripts/make-logo-mark.mjs`
- Create: `public/logo-mark.png` (hasil skrip, di-commit)
- Modify: `package.json` (script `logo:mark`)

**Interfaces:**
- Produces: berkas `public/logo-mark.png` berukuran **807x262 (rasio 3.08)**, hasil crop ke bar hitam wordmark CLASH/SOCCER. Dipakai Task 7 (navbar, footer).

- [ ] **Step 1: Tulis skrip pembuat mark**

Skrip membaca `public/logo.png` dan mengambil bar hitam wordmark dengan `.extract({ left: 108, top: 261, width: 807, height: 262 })`, lalu menulis `public/logo-mark.png`. Hasil terverifikasi: **807x262, rasio 3.08**. Batas crop diukur dari piksel: bar hitam solid di baris 261..523 dan kolom 108..914; glyph putih di dalamnya di x 151..871, y 299..490; tidak ada piksel putih di kolom tepi, jadi tidak ada glyph terpotong. Tinggi berhenti di 262 (bukan 263) karena baris 523 adalah tepi anti-alias stroke putih shield di bawah bar. **Jangan memakai `.trim()`**: trim akan memotong balik ke glyph putih dan membuang bidang hitam yang membuat mark terbaca di navbar gelap. `sharp` bukan dependency proyek (opsional milik `next`), jadi impor lewat `await import("sharp")` di dalam try/catch agar pesan errornya terbaca. Cetak lebar, tinggi, dan rasio hasil.

- [ ] **Step 2: Jalankan skrip**

Run: `node scripts/make-logo-mark.mjs`
Expected: mencetak `807x262 ratio=3.08` dan menulis `public/logo-mark.png`.

- [ ] **Step 3: Periksa hasilnya secara visual**

Buka `public/logo-mark.png` dengan tool `read`. Pastikan tulisan "CLASH" dan "SOCCER" terbaca utuh, tidak terpotong di bawah, dan tidak ada sisa crest (pita merah/hijau di atas, helm di bawah, bingkai putih shield) di tepi mana pun. Kalau bar hitam belum pas, geser `top`/`height` pada `extract` dan ulangi Step 2. Verifikasi tambahan: render mark pada tinggi 28, 32, dan 40 px di atas latar `#0C0C0D` dan pastikan wordmark masih terbaca.

- [ ] **Step 4: Tambahkan script npm**

Di `package.json`, tambahkan `"logo:mark": "node scripts/make-logo-mark.mjs"` di dalam `scripts`.

- [ ] **Step 5: Commit**

```bash
git add scripts/make-logo-mark.mjs public/logo-mark.png package.json
git commit -m "feat(design): generate wordmark logo for the navbar"
```

---

### Task 3: Logika tata letak jadwal (TDD)

**Files:**
- Create: `src/lib/schedule-layout.ts`
- Test: `tests/schedule-layout.test.ts`

**Interfaces:**
- Produces:
  - `monthKey(date: string): string` → `"2026-11"`
  - `monthLabel(date: string): string` → `"November 2026"`
  - `groupMatchesByMonth<T extends { date: string }>(matches: T[]): { key: string; label: string; matches: T[] }[]`
  - `slotStatus(slotsAvailable: number, slotsTotal: number): { state: "full" | "low" | "open"; percent: number }`
  - `withoutMatch<T extends { id: string }>(matches: T[], id: string | undefined): T[]`
- Dipakai Task 5 (`FixtureRow`), Task 8 (beranda), Task 9 (jadwal).

- [ ] **Step 1: Tulis test yang gagal**

Buat `tests/schedule-layout.test.ts` dengan `import test from "node:test"`, `import assert from "node:assert/strict"`, dan impor kelima fungsi dari `../src/lib/schedule-layout.ts`. Test yang harus ada:

```ts
test("monthLabel menulis nama bulan dalam bahasa Indonesia", () => {
  assert.equal(monthLabel("2026-11-09"), "November 2026");
  assert.equal(monthLabel("2026-01-01"), "Januari 2026");
});

test("groupMatchesByMonth mengelompokkan dan mempertahankan urutan", () => {
  const matches = [
    { id: "a", date: "2026-11-09" },
    { id: "b", date: "2026-11-27" },
    { id: "c", date: "2026-12-04" },
  ];
  const groups = groupMatchesByMonth(matches);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "November 2026");
  assert.deepEqual(groups[0].matches.map((m) => m.id), ["a", "b"]);
  assert.equal(groups[1].label, "Desember 2026");
});

test("groupMatchesByMonth mengembalikan array kosong untuk input kosong", () => {
  assert.deepEqual(groupMatchesByMonth([]), []);
});

test("slotStatus menandai slot penuh", () => {
  assert.equal(slotStatus(0, 20).state, "full");
  assert.equal(slotStatus(0, 20).percent, 0);
});

test("slotStatus menandai slot menipis di bawah 25 persen", () => {
  assert.equal(slotStatus(3, 20).state, "low");
  assert.equal(slotStatus(4, 20).state, "open");
});

test("slotStatus tidak membagi nol saat slotsTotal nol", () => {
  assert.equal(slotStatus(0, 0).state, "full");
  assert.equal(slotStatus(0, 0).percent, 0);
});

test("withoutMatch membuang satu laga tanpa mengubah array asli", () => {
  const matches = [{ id: "a" }, { id: "b" }];
  const result = withoutMatch(matches, "a");
  assert.deepEqual(result.map((m) => m.id), ["b"]);
  assert.equal(matches.length, 2);
});

test("withoutMatch mengembalikan salinan saat id tidak ditemukan", () => {
  const matches = [{ id: "a" }];
  assert.deepEqual(withoutMatch(matches, "z").map((m) => m.id), ["a"]);
  assert.deepEqual(withoutMatch(matches, undefined).map((m) => m.id), ["a"]);
});
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

Run: `node --test tests/schedule-layout.test.ts`
Expected: FAIL karena modul `schedule-layout.ts` belum ada.

- [ ] **Step 3: Implementasikan `src/lib/schedule-layout.ts`**

Ekspor kelima fungsi dengan signature di Interfaces. `monthLabel` memakai array nama bulan Indonesia yang ditulis eksplisit (bukan `toLocaleDateString`) supaya hasilnya deterministik di mesin mana pun. `groupMatchesByMonth` melakukan satu lintasan dan mempertahankan urutan input. `slotStatus` mengembalikan `percent = Math.round((slotsAvailable / slotsTotal) * 100)` dengan penjaga `slotsTotal <= 0` menghasilkan `{ state: "full", percent: 0 }`; `state` adalah `"full"` saat `slotsAvailable <= 0`, `"low"` saat `percent < 25`, selain itu `"open"`. `withoutMatch` memakai `filter` sehingga selalu mengembalikan array baru. Tulis komentar satu paragraf di kepala berkas yang menjelaskan bahwa berkas ini murni supaya bisa diuji tanpa database.

- [ ] **Step 4: Jalankan test untuk memastikan lolos**

Run: `node --test tests/schedule-layout.test.ts`
Expected: PASS, 8 test.

- [ ] **Step 5: Commit**

```bash
git add tests/schedule-layout.test.ts src/lib/schedule-layout.ts
git commit -m "feat(design): add pure schedule layout helpers"
```

---

### Task 4: Primitif seksi dan header halaman

**Files:**
- Create: `src/components/section-label.tsx`
- Create: `src/components/page-head.tsx`
- Modify: `src/components/section.tsx` (hapus `SectionTitle` dan `SectionSubtitle`, sisakan `Section` dengan prop `spacing`)

**Interfaces:**
- Consumes: `font-condensed`, `text-bone`, `text-bone-dim`, `bg-crest` dari Task 1.
- Produces:
  - `Section({ children, className, id, spacing }: { children: React.ReactNode; className?: string; id?: string; spacing?: "tight" | "normal" | "loose" })`
  - `SectionLabel({ children, as }: { children: React.ReactNode; as?: "h2" | "h3" })` merender elemen heading dengan garis merah 2px di bawah label.
  - `PageHead({ title, subtitle, meta }: { title: string; subtitle?: string; meta?: string })` merender satu `h1`.

- [ ] **Step 1: Tulis `SectionLabel`**

`src/components/section-label.tsx` adalah server component (tanpa `"use client"`, tanpa framer-motion). Merender `<Tag className="font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim">` diikuti `<span className="mt-2 block h-0.5 w-10 bg-crest" aria-hidden="true" />`. `Tag` default `"h2"` agar struktur heading tetap ada. Tidak ada animasi.

- [ ] **Step 2: Tulis `PageHead`**

`src/components/page-head.tsx` adalah server component. Merender `<header className="border-b border-ink-line">` berisi `<div className="mx-auto max-w-6xl px-4 pb-8 pt-28 md:pt-32">`, lalu `meta` (opsional) dalam `font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim`, lalu `<h1 className="mt-3 font-statement text-4xl leading-[1.05] text-bone md:text-6xl">`, lalu `subtitle` dalam `<p className="mt-4 max-w-2xl text-base text-bone-dim md:text-lg">`. `pt-28 md:pt-32` memberi ruang untuk navbar fixed tanpa menyisakan 250px kosong.

- [ ] **Step 3: Ubah `Section`**

Hapus `SectionTitle` dan `SectionSubtitle` beserta import `motion` di baris 3 (kalau import itu tidak dipakai lagi). Tambahkan prop `spacing` dengan nilai default `"normal"` dan peta kelas: `tight` → `py-14 md:py-20`, `normal` → `py-20 md:py-28`, `loose` → `py-24 md:py-36`. Pertahankan `px-4` dan `mx-auto max-w-7xl`.

- [ ] **Step 4: Perbaiki pemakai sementara agar build tetap lolos**

`src/components/views/home-view.tsx` masih memakai `SectionTitle`/`SectionSubtitle`. Ganti sementara setiap `<SectionTitle>X</SectionTitle>` dengan `<SectionLabel>X</SectionLabel>` dan hapus setiap `<SectionSubtitle>`. Sesuaikan import di baris 8. Ini hanya agar kompilasi tetap hijau; Task 8 mengganti seluruh berkas.

- [ ] **Step 5: Verifikasi**

Run: `npx tsc --noEmit && npm run lint`
Expected: lolos.

- [ ] **Step 6: Commit**

```bash
git add src/components/section-label.tsx src/components/page-head.tsx src/components/section.tsx src/components/views/home-view.tsx
git commit -m "feat(design): add section label and page head primitives"
```

---

### Task 5: Baris jadwal dan status slot

**Files:**
- Create: `src/components/fixture-row.tsx`
- Create: `src/components/slot-meter.tsx`

**Interfaces:**
- Consumes: `slotStatus` dari Task 3; `formatDate`, `formatTime` dari `src/lib/format.ts`.
- Produces:
  - `SlotMeter({ available, total }: { available: number; total: number })` merender angka sisa, total, dan bar kemajuan.
  - `FixtureRow({ match }: { match: Match })` merender satu baris jadwal yang seluruh barisnya adalah tautan ke `/schedule/{id}`.

- [ ] **Step 1: Tulis `SlotMeter`**

Merender `<span className="font-condensed text-2xl text-bone">{available}</span><span className="text-sm text-bone-dim">/{total}</span>` lalu bar `<div className="mt-1 h-1 w-full bg-ink-line">` dengan anak `<div className="h-full bg-pitch" style={{ width: `${percent}%` }} />`. Saat `state === "full"`, teks angka memakai `text-bone-dim` dan bar kosong. Beri `aria-label` pada pembungkus: `` `${available} dari ${total} slot tersedia` ``. Jangan memakai warna saja: sertakan teks "penuh" saat `state === "full"`.

- [ ] **Step 2: Tulis `FixtureRow`**

Merender `<Link href={`/schedule/${match.id}`} className="group grid grid-cols-1 gap-2 border-b border-ink-line py-5 transition-transform duration-200 hover:-translate-y-0.5 md:grid-cols-[9rem_1fr_auto] md:items-center md:gap-6">`. Kolom 1: tanggal dan jam dalam `font-condensed uppercase text-bone-dim`. Kolom 2: `h3` judul dalam `font-condensed text-xl text-bone` plus lokasi dalam `text-sm text-bone-dim`. Kolom 3: `SlotMeter`. Saat `match.status === "ongoing"`, tambahkan badge `<span className="font-condensed text-xs uppercase tracking-[0.18em] text-crest-ink">` berisi titik `<span className="live-pulse mr-1 inline-block h-1.5 w-1.5 rounded-full bg-crest-ink" />` dan teks `LIVE`. Baris harus punya `cursor-pointer` (dari `<Link>` bawaan) dan target minimal 44px tinggi lewat `py-5`.

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit && npm run lint`
Expected: lolos. Komponen belum dipakai, jadi tidak ada test runtime.

- [ ] **Step 4: Commit**

```bash
git add src/components/fixture-row.tsx src/components/slot-meter.tsx
git commit -m "feat(design): add fixture row and slot meter"
```

---

### Task 6: Kartu berita dan tile album

**Files:**
- Create: `src/components/story-card.tsx`
- Create: `src/components/album-tile.tsx`

**Interfaces:**
- Consumes: `BrandFallback` dari `src/components/content-state.tsx`; `formatDate`.
- Produces:
  - `StoryCard({ item, featured }: { item: NewsItem; featured?: boolean })`
  - `AlbumTile({ album, aspect }: { album: Album; aspect?: "wide" | "tall" })`

- [ ] **Step 1: Tulis `StoryCard`**

`featured` merender bingkai `aspect-[16/9]` dengan gambar `object-cover` (bukan `object-contain`), judul `font-statement text-2xl md:text-4xl`, dan excerpt satu baris. Non-featured merender baris horizontal: tanggal `font-condensed` di kiri, judul `font-statement text-lg` di kanan, tanpa gambar. Saat `coverImage` kosong, render `<BrandFallback label="CLASH / NEWS" />` di dalam bingkai. `sizes` wajib diisi: `"(max-width: 768px) 100vw, 66vw"` untuk featured, tidak dipakai untuk non-featured. Gambar memakai `fill` di dalam bingkai `relative`.

- [ ] **Step 2: Tulis `AlbumTile`**

Bingkai `relative overflow-hidden` dengan `aspect-[4/3]` untuk `wide` dan `aspect-[3/4]` untuk `tall`, gambar `object-cover` dengan `sizes` `"(max-width: 768px) 100vw, 50vw"`, dan efek hover `group-hover:scale-[1.02]` pada gambar. Saat `coverUrl` kosong, render `<BrandFallback label="CLASH / MATCH DAY" />`. Judul album `font-statement text-xl text-bone`, tanggal `font-condensed text-xs uppercase text-bone-dim`, jumlah item `text-sm text-bone-dim`. Kalau `album.gdriveLink` ada, bungkus dengan `<a target="_blank" rel="noopener noreferrer">`; kalau tidak, `<Link href={`/gallery/${album.id}`}>`.

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit && npm run lint`
Expected: lolos.

- [ ] **Step 4: Commit**

```bash
git add src/components/story-card.tsx src/components/album-tile.tsx
git commit -m "feat(design): add story card and album tile"
```

---

### Task 7: Navbar dan footer

**Files:**
- Modify: `src/components/navbar.tsx` (seluruh berkas)
- Modify: `src/components/footer.tsx` (seluruh berkas)

**Interfaces:**
- Consumes: `public/logo-mark.png` dari Task 2; token dari Task 1.
- Produces: tidak ada ekspor baru; kedua komponen tetap diekspor default dengan prop yang sama.

- [ ] **Step 1: Tulis ulang `navbar.tsx`**

Pertahankan `links` dan perilaku `usePathname`. Latar `bg-ink/95 backdrop-blur-sm border-b border-ink-line` saat `scrolled || !isHome`, transparan saat beranda di posisi atas. Logo memakai `src="/logo-mark.png"` dengan `width={807} height={262}` dan `className="h-7 w-auto md:h-8"`, alt `"Clash Soccer"`. Hapus teks "CLASH.SOCCER" di samping logo karena wordmark sudah memuatnya. Tautan desktop memakai `font-condensed text-sm uppercase tracking-[0.14em]`, aktif `text-bone` dengan `border-b-2 border-crest pb-1`, tidak aktif `text-bone-dim hover:text-bone`. Tombol menu mobile: `aria-label` menjadi `"Menu"`, tambahkan `aria-expanded={mobileOpen}` dan `aria-controls="mobile-menu"`, beri `p-3` agar target 44px. Panel mobile memakai `id="mobile-menu"`, latar `bg-ink`, tautan `font-statement text-3xl text-bone` dengan `py-3` per tautan. Pertahankan `AnimatePresence` hanya untuk buka/tutup panel; hapus animasi `y` per tautan dan ganti dengan satu fade 150ms. Hapus `font-display`.

- [ ] **Step 2: Tulis ulang `footer.tsx`**

Pertahankan prop `settings` dan rendering server. Latar `bg-ink` dengan `border-t border-ink-line`. Logo memakai `/logo-mark.png` dengan `h-7 w-auto`. `settings.description` tetap dirender dalam `<p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-dim">`. Label kolom memakai `font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim`. Tautan `text-sm text-bone-dim hover:text-bone`. Baris bawah memakai `border-t border-ink-line`. Ganti `font-display` dengan `font-condensed`.

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit && npm run lint`
Expected: lolos.

- [ ] **Step 4: Verifikasi E2E footer**

Run: `npx playwright test e2e/footer-ssr.spec.ts`
Expected: PASS. Test ini memastikan `settings.description` ada di HTML awal.

- [ ] **Step 5: Commit**

```bash
git add src/components/navbar.tsx src/components/footer.tsx
git commit -m "feat(design): restyle navbar and footer with the crest wordmark"
```

---

### Task 8: Beranda

**Files:**
- Modify: `src/components/views/home-view.tsx` (seluruh berkas, ditulis ulang)
- Modify: `src/app/page.tsx:22` (kirim laga berikutnya tanpa laga utama)

**Interfaces:**
- Consumes: `SectionLabel`, `Section` (Task 4), `FixtureRow`, `SlotMeter` (Task 5), `StoryCard`, `AlbumTile` (Task 6), `withoutMatch` (Task 3).
- Produces: `HomeView` dengan prop yang sama seperti sekarang, ditambah `followingMatches: Match[]`.

- [ ] **Step 1: Ubah `src/app/page.tsx`**

Ganti perhitungan `upcoming` menjadi mengambil tiga laga setelah laga utama: `const upcoming = sortByKickoff(current); const nextMatch = pickNextMatch(current); const following = withoutMatch(upcoming, nextMatch?.id).slice(0, 3);`. Kirim `followingMatches={following}` ke `HomeView` dan hapus prop `upcomingMatches`. Impor `withoutMatch` dari `@/lib/schedule-layout`.

- [ ] **Step 2: Tulis ulang hero**

Berkas tetap `"use client"`. Hapus `useRandomParticles`, seluruh `motion.div` partikel, dan overlay gradien. Struktur: `<section className="relative border-b border-ink-line">` dengan grid `lg:grid-cols-[1.1fr_1fr]`. Kiri: `<div className="hero-enter px-4 py-28 md:py-36">` berisi satu `h1` yang memuat kedua baris: `<span className="block font-statement text-5xl italic leading-[0.95] text-bone md:text-7xl">Less talk.</span><span className="mt-2 block font-condensed text-5xl uppercase leading-[0.9] text-bone md:text-8xl">More football.</span>`. Karena keduanya di dalam satu `h1`, regex `/less talk/i` tetap cocok. Di bawah `h1`: `<p className="mt-6 max-w-md text-base text-bone-dim">` berisi `settings.description`. Lalu baris fakta dari data: `<p className="mt-6 font-condensed text-sm uppercase tracking-[0.14em] text-bone-dim">{settings.location} · {followingMatches.length + (nextMatch ? 1 : 0)} laga mendatang</p>`. Lalu dua tautan: `/schedule` dengan `bg-crest text-bone` dan `/about` dengan `border border-bone-dim text-bone`. Kanan: foto hero `demo-album-01-cover.jpg` sebagai `<Image src="/api/uploads/demo/demo-album-01-cover.jpg" ... />` dengan `width={1200} height={701}`, `priority`, `className="h-full w-full object-cover"`, `sizes="(max-width: 1024px) 100vw, 50vw"`, di dalam `relative aspect-[4/3] lg:aspect-auto lg:min-h-[560px]`. Di bawah `lg`, foto menjadi pita penuh lebar.

- [ ] **Step 3: Tulis blok laga berikutnya**

`<Section spacing="tight">` dengan `<SectionLabel>Laga berikutnya</SectionLabel>`. Kalau `nextMatch` ada: tampilkan tanggal besar `font-condensed text-2xl uppercase text-bone-dim`, judul `font-statement text-4xl md:text-6xl text-bone`, lalu baris jam dan lokasi, lalu `<SlotMeter available={nextMatch.slotsAvailable} total={nextMatch.slotsTotal} />`, lalu tautan `bg-crest text-bone` ke `/schedule/{id}` berisi `RSVP laga ini`. Kalau `nextMatch` tidak ada: render `<EmptyState title="Belum ada laga terjadwal" description="Jadwal berikutnya akan muncul di sini." />`.

- [ ] **Step 4: Tulis fixture list**

Kalau `followingMatches.length > 0`, `<Section spacing="tight">` dengan `<SectionLabel>Jadwal mendatang</SectionLabel>` lalu `followingMatches.map((m) => <FixtureRow key={m.id} match={m} />)`. Kalau kosong, jangan render seksi ini sama sekali (bukan seksi kosong).

- [ ] **Step 5: Tulis seksi tentang, berita, galeri, FAQ, kontak**

Tentang: `Section` dua kolom, teks di kiri (`font-statement text-3xl md:text-4xl text-bone` untuk judul, paragraf `text-bone-dim`), foto `demo-album-02-4.jpg` di kanan dalam `aspect-[4/3] object-cover`. Berita: `<SectionLabel>Berita</SectionLabel>`, `latestNews[0]` sebagai `<StoryCard featured />`, sisanya `<StoryCard />` dalam kolom. Galeri: `<SectionLabel>Galeri</SectionLabel>`, `latestAlbums[0]` sebagai `<AlbumTile aspect="wide" />` dan dua berikutnya `<AlbumTile aspect="tall" />`. FAQ: `<SectionLabel>Pertanyaan umum</SectionLabel>`, daftar `faqPreview` dengan `border-b border-ink-line py-5`, pertanyaan `font-condensed text-lg text-bone`, jawaban `text-sm text-bone-dim`. Kontak: `font-statement text-4xl md:text-5xl text-bone` berisi ajakan, lalu dua tautan tombol. Setiap seksi memakai `spacing` berbeda-beda (`tight`, `normal`, `loose`) agar ritme tidak seragam. Tidak ada `whileInView` di mana pun.

- [ ] **Step 6: Verifikasi**

Run: `npx tsc --noEmit && npm run lint && npx playwright test e2e/public-pages.spec.ts`
Expected: PASS, termasuk `h1` beranda yang cocok `/less talk/i`.

- [ ] **Step 7: Verifikasi visual beranda**

Jalankan dev server, buka `http://127.0.0.1:3000/` lewat `chrome-devtools` MCP pada 1440x900 dan 390x844. Pastikan: laga utama tidak muncul dua kali, tidak ada partikel, tidak ada scroll horizontal, semua gambar `naturalWidth > 0`, dan console tanpa error.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/components/views/home-view.tsx
git commit -m "feat(design): rebuild the home page around the next fixture"
```

---

### Task 9: Halaman jadwal dan detail laga

**Files:**
- Modify: `src/components/views/schedule-view.tsx` (seluruh berkas)
- Modify: `src/components/views/schedule-detail-view.tsx` (heading dan token warna)

**Interfaces:**
- Consumes: `PageHead` (Task 4), `FixtureRow` (Task 5), `groupMatchesByMonth` (Task 3).

- [ ] **Step 1: Tulis ulang `schedule-view.tsx`**

`<PageHead title="Schedule" meta={`${upcomingMatches.length} laga mendatang`} subtitle="Jadwal pertandingan Clash.Soccer. Pilih laga untuk RSVP." />`. Jumlah laga berada di prop `meta`, **di luar `h1`**, supaya regex `/^schedule$/i` tetap cocok. Setelah header: kalau `upcomingMatches.length === 0`, render `<EmptyState title="Belum ada pertandingan" description="Jadwal pertandingan berikutnya akan muncul di sini." />`. Kalau ada, `groupMatchesByMonth(upcomingMatches).map(...)`: untuk setiap grup render `<h2 className="font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim">{group.label}</h2>` lalu baris-baris `<FixtureRow />`. Tombol "Show/Hide past matches" dipertahankan dengan `aria-expanded` dan `aria-controls`, gayanya `font-condensed uppercase text-bone-dim hover:text-bone` dengan `py-3`.

- [ ] **Step 2: Tambahkan `h1` di detail laga**

Di `schedule-detail-view.tsx:93`, ubah `<h2 ...>` yang memuat `{current.title}` menjadi `<h1 className="font-statement text-4xl text-bone md:text-6xl">`. Heading di baris 168 dan 301 tetap `h2`. Ganti `font-display` dengan `font-condensed` atau `font-statement` sesuai peran, dan ganti token `text-primary-text` → `text-bone`, `text-secondary-text` → `text-bone-dim`, `border-border` → `border-ink-line`, `bg-elevated` → `bg-ink-raised`, `bg-accent text-charcoal` → `bg-crest text-bone`. Batas input memakai `border-bone-dim` (bukan `border-ink-line`). Jangan mengubah logika RSVP.

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit && npm run lint && npx playwright test e2e/public-pages.spec.ts`
Expected: PASS. `/schedule` `h1` tetap persis "Schedule".

- [ ] **Step 4: Verifikasi visual**

Buka `/schedule` dan satu `/schedule/demo-match-05` di 1440 dan 390. Pastikan `h1` ada tepat satu di kedua halaman, laga `ongoing` muncul dengan label LIVE, dan tidak ada scroll horizontal.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/schedule-view.tsx src/components/views/schedule-detail-view.tsx
git commit -m "feat(design): rebuild schedule as a grouped fixture list"
```

---

### Task 10: Halaman galeri dan detail album

**Files:**
- Modify: `src/app/gallery/page.tsx`
- Modify: `src/components/views/gallery-detail-view.tsx`

**Interfaces:**
- Consumes: `PageHead` (Task 4), `AlbumTile` (Task 6), `EmptyState`.

- [ ] **Step 1: Tulis ulang `gallery/page.tsx`**

Ganti `PageHeader` dengan `<PageHead title="Gallery" subtitle="Dokumentasi setiap momen pertandingan Clash.Soccer." />`. Ganti `<p>Belum ada album.</p>` di baris 26 dengan `<EmptyState title="Belum ada album" description="Dokumentasi pertandingan akan muncul di sini." />`. Grid menjadi `grid grid-cols-1 gap-8 sm:grid-cols-2` dengan `<AlbumTile album={album} aspect={i % 3 === 0 ? "wide" : "tall"} />`.

- [ ] **Step 2: Perbaiki aksesibilitas lightbox**

Di `gallery-detail-view.tsx`, ubah `<motion.div ... onClick={() => ...}>` pada baris 34-41 menjadi `<motion.button type="button" onClick={() => ...} aria-label={`Buka foto ${i + 1} dari ${album.items.length}`} className="...">`. Karena `motion.button` menerima `type`, ini tetap sah. Tambahkan `focus-visible` ring lewat kelas yang sudah global. Ganti `object-cover` tetap, `alt` tetap `""` karena judul album sudah memberi konteks. Ganti `PageHeader` dengan `PageHead`, dan migrasikan token warna seperti Task 9.

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit && npm run lint && npx playwright test e2e/public-pages.spec.ts`
Expected: PASS. `/gallery` `h1` tetap persis "Gallery".

- [ ] **Step 4: Verifikasi visual**

Buka `/gallery` di 1440 dan 390. Pastikan tidak ada bar hitam letterbox, tidak ada kartu dengan ruang kosong besar, dan setiap tile punya gambar termuat.

- [ ] **Step 5: Commit**

```bash
git add src/app/gallery/page.tsx src/components/views/gallery-detail-view.tsx
git commit -m "feat(design): rebuild gallery with cover-cropped tiles"
```

---

### Task 11: Halaman berita dan detail artikel

**Files:**
- Modify: `src/app/news/page.tsx`
- Modify: `src/components/views/news-detail-view.tsx`

**Interfaces:**
- Consumes: `PageHead` (Task 4), `StoryCard` (Task 6), `EmptyState`.

- [ ] **Step 1: Tulis ulang `news/page.tsx`**

`<PageHead title="News" subtitle="Berita, pengumuman, dan informasi terbaru dari komunitas Clash.Soccer." />`. Kalau `news.length === 0`, `<EmptyState title="Belum ada berita" description="Berita dan pengumuman akan muncul di sini." />`. Kalau ada: `<StoryCard item={news[0]} featured />` lalu sisanya dalam `<div className="mt-10 border-t border-ink-line">` berisi `<StoryCard item={item} />` per item.

- [ ] **Step 2: Tulis ulang header `news-detail-view.tsx`**

Ganti `div` header manual dengan `<PageHead title={article.title} meta={formatDate(article.date)} />`. Hapus `motion` dari header. Isi artikel: kolom `mx-auto max-w-2xl`, paragraf pertama diberi kelas drop cap lewat `first-letter:float-left first-letter:mr-3 first-letter:font-statement first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-bone`. Foto cover memakai `aspect-[16/9] object-cover`. Migrasikan token warna. Tautan share tetap ada.

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit && npm run lint && npx playwright test e2e/public-pages.spec.ts`
Expected: PASS. `/news` `h1` tetap persis "News".

- [ ] **Step 4: Commit**

```bash
git add src/app/news/page.tsx src/components/views/news-detail-view.tsx
git commit -m "feat(design): rebuild news index and article header"
```

---

### Task 12: FAQ, tentang, kontak

**Files:**
- Modify: `src/components/views/faq-view.tsx`
- Modify: `src/components/views/about-view.tsx`
- Modify: `src/components/views/contact-view.tsx`

**Interfaces:**
- Consumes: `PageHead` (Task 4).

- [ ] **Step 1: Perbarui `faq-view.tsx`**

Ganti `PageHeader` dengan `<PageHead title="FAQ" subtitle="Pertanyaan yang sering diajukan tentang Clash.Soccer." />`. Input pencarian memakai `border-bone-dim bg-ink-raised text-bone placeholder:text-bone-dim`, `aria-label` dipertahankan. Baris FAQ memakai `border-b border-ink-line`, pertanyaan `font-condensed text-lg text-bone`, jawaban `text-bone-dim`. Pertahankan logika `openId`, `aria-expanded`, `aria-controls`, dan `AnimatePresence` untuk tinggi jawaban.

- [ ] **Step 2: Perbarui `about-view.tsx`**

Ganti `PageHeader` dengan `<PageHead title="About" subtitle="Tentang Clash.Soccer, komunitas mini soccer di Depok." />`. Hapus kotak logo bergradien. Ganti dengan `<Image src="/api/uploads/demo/demo-album-02-4.jpg" width={1000} height={665} className="h-full w-full object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />` di dalam `aspect-[4/3]`. Ubah paragraf yang menyebut "berbasis di Jakarta" menjadi "berbasis di Depok" agar sesuai `settings.location`. Judul seksi memakai `font-statement text-3xl md:text-4xl`. Hapus `motion` dan `whileInView`.

- [ ] **Step 3: Perbarui `contact-view.tsx`**

Ganti `PageHeader` dengan `<PageHead title="Contact" subtitle="Hubungi Clash.Soccer melalui WhatsApp atau Instagram." />`. Ubah dua kartu menjadi dua baris besar: `<a>` dengan `grid gap-2 border-b border-ink-line py-8` berisi label `font-condensed text-xs uppercase tracking-[0.18em] text-bone-dim` dan nilai `font-statement text-2xl text-bone md:text-3xl`. Hapus `Card` dan `motion`. Ikon tetap ada dengan `aria-hidden="true"`.

- [ ] **Step 4: Verifikasi**

Run: `npx tsc --noEmit && npm run lint && npx playwright test e2e/public-pages.spec.ts`
Expected: PASS. `h1` `/faq` "FAQ", `/about` "About", `/contact` "Contact" tetap persis.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/faq-view.tsx src/components/views/about-view.tsx src/components/views/contact-view.tsx
git commit -m "feat(design): restyle faq, about, and contact pages"
```

---

### Task 13: State kosong, 404, error, dan transisi halaman

**Files:**
- Modify: `src/components/content-state.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/error.tsx`
- Modify: `src/components/layout-content.tsx:19-36`

**Interfaces:**
- Consumes: token dari Task 1.
- Produces: `EmptyState`, `ErrorState`, `LoadingState`, `BrandFallback` dengan tampilan baru, signature tidak berubah.

- [ ] **Step 1: Perbarui `content-state.tsx`**

`EmptyState`: `border border-dashed border-ink-line p-10 text-center`, judul `font-condensed text-lg text-bone`, deskripsi `text-sm text-bone-dim`. `ErrorState`: `border border-crest-ink/40 bg-crest-ink/5`, judul `font-condensed text-lg text-bone`, tombol `border border-crest-ink text-crest-ink`. `LoadingState`: teks `font-condensed uppercase tracking-[0.18em] text-bone-dim`, `role="status"` dipertahankan. `BrandFallback`: latar `bg-ink-raised`, label `font-condensed`, hapus pola grid dekoratif atau ganti dengan satu garis `border-t border-ink-line`. Signature keempatnya tidak berubah.

- [ ] **Step 2: Perbarui `not-found.tsx` dan `error.tsx`**

Ganti kotak `border-border bg-surface` menjadi tanpa kotak: pembungkus `min-h-[60vh] flex items-center justify-center px-4`, isi `max-w-md text-center`. `h1` memakai `font-statement text-3xl text-bone`. Pertahankan kedua tautan di `not-found` dan tombol `reset` plus tautan beranda di `error`. Tombol utama `bg-crest text-bone`, sekunder `border border-bone-dim text-bone`. Migrasikan token warna.

- [ ] **Step 3: Hapus transisi halaman**

Di `layout-content.tsx`, hapus `AnimatePresence` dan `motion.div` yang membungkus `{children}`. Ganti dengan `<div>{children}</div>`. Hapus import `motion`/`AnimatePresence` bila tidak dipakai lagi. Ini menghapus satu-satunya animasi yang tidak bisa dimatikan oleh CSS `prefers-reduced-motion`.

- [ ] **Step 4: Verifikasi**

Run: `npx tsc --noEmit && npm run lint`
Expected: lolos.

- [ ] **Step 5: Verifikasi 404 di browser**

Buka `http://127.0.0.1:3000/halaman-tidak-ada`. Pastikan status 404, `h1` terlihat, kedua tautan bisa diklik, dan tidak ada console error.

- [ ] **Step 6: Commit**

```bash
git add src/components/content-state.tsx src/app/not-found.tsx src/app/error.tsx src/components/layout-content.tsx
git commit -m "feat(design): restyle empty, error, and not-found states"
```

---

### Task 14: Hapus komponen mati dan verifikasi menyeluruh

**Files:**
- Delete: `src/components/page-header.tsx`, `src/components/match-card.tsx`, `src/components/news-card.tsx`, `src/components/gallery-card.tsx`
- Modify: `src/app/globals.css` (hapus token `accent-dim`/`accent-subtle` bila benar-benar tidak terpakai)

**Interfaces:**
- Consumes: semua task sebelumnya.

- [ ] **Step 1: Pastikan tidak ada pemakai**

Run: `grep -rn "page-header\|match-card\|news-card\|gallery-card" src/`
Expected: tidak ada hasil. Kalau masih ada, perbaiki dulu pemakainya.

- [ ] **Step 2: Hapus berkas**

```bash
git rm src/components/page-header.tsx src/components/match-card.tsx src/components/news-card.tsx src/components/gallery-card.tsx
```

- [ ] **Step 3: Cek token yang tidak terpakai**

Run: `grep -rn "accent-dim\|accent-subtle" src/`
Kalau tidak ada hasil, hapus kedua baris itu dari `@theme inline`. Kalau masih ada pemakai, biarkan.

- [ ] **Step 4: Jalankan seluruh verifikasi**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: keempatnya lolos. `npm test` harus 167 test lama plus 8 test baru = 175 test lulus.

- [ ] **Step 5: Jalankan E2E penuh**

Matikan dev server yang sedang berjalan lebih dulu (`Get-NetTCPConnection -LocalPort 3000` lalu `Stop-Process`), karena `playwright.config.ts` memakai `reuseExistingServer` dan kredensial E2E berbeda dari `.env.local`.

Run: `npm run test:e2e`
Expected: seluruh test lulus, termasuk `public-pages`, `footer-ssr`, `ops`, `upload`, dan `admin-modal`.

- [ ] **Step 6: Audit visual semua halaman**

Dengan `chrome-devtools` MCP, buka setiap halaman publik pada 1440x900, 1024x768, 768x1024, dan 390x844: `/`, `/schedule`, `/schedule/demo-match-05`, `/gallery`, `/gallery/demo-album-01`, `/news`, satu detail berita, `/faq`, `/about`, `/contact`, dan satu URL 404. Untuk setiap halaman dan setiap lebar, catat: jumlah `h1` (harus 1), ada/tidak scroll horizontal (`document.documentElement.scrollWidth > innerWidth`), gambar dengan `naturalWidth === 0`, dan console error. Semua harus bersih.

- [ ] **Step 7: Verifikasi kontras di browser**

Ambil warna terhitung untuk setiap teks di atas latar gelap dan hitung rasionya. Semua teks normal harus >= 4.5:1, teks besar >= 3:1, dan batas kontrol >= 3:1. Perbaiki yang gagal.

- [ ] **Step 8: Verifikasi reduced motion**

Emulasikan `prefers-reduced-motion: reduce` lewat `chrome-devtools` `emulate`. Pastikan tidak ada konten yang tersembunyi, titik LIVE tidak berdenyut, dan hero tidak beranimasi.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(design): remove superseded public components"
```

---

## Catatan eksekusi

- Task 1-3 tidak mengubah tampilan yang terlihat (kecuali font terpasang), jadi aman dijalankan berurutan tanpa review visual.
- Task 4-7 membangun primitif; tampilan lama masih dipakai sampai Task 8-12 menggantinya. Build harus tetap hijau di setiap titik.
- Task 8-12 masing-masing mengganti satu halaman penuh. Setelah tiap task, jalankan `npx playwright test e2e/public-pages.spec.ts` karena test itu mengunci `h1` semua halaman.
- Kalau sebuah task gagal di Step verifikasi, perbaiki dulu sebelum commit. Jangan menumpuk perbaikan ke task berikutnya.
