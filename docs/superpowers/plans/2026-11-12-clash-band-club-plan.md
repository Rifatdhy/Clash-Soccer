# Clash.Soccer Band-Club Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menggabungkan struktur tour dates, visual band poster, dan archive komunitas ke public experience Clash.Soccer tanpa mengubah flow backend/RSVP.

**Architecture:** Pertahankan data fetching dan route yang ada. Tambahkan token warna terpusat di `globals.css`, lalu gunakan komponen presentasi existing (`home-view`, `match-card`, `schedule-view`, `news-card`, `gallery-card`, `footer`) agar perubahan tetap dangkal dan mudah direview.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-11-11-clash-band-club-design.md`

## Global Constraints

- Primary logo tetap `public/logo.png`.
- Tidak menyalin logo, foto, copy, layout spesifik, atau aset band mana pun.
- Tidak mengubah database schema, API RSVP, auth, rate limit, capacity locking, atau validasi.
- Red `#D94732` hanya untuk action/match urgency; green `#759A72` hanya sebagai secondary field/community accent.
- Semua fixture information penting tetap terlihat tanpa hover dan tidak overflow di mobile.
- Tidak menambahkan dependency atau remote image dependency.

## Review Focus

- Mobile poster layout: tanggal, venue, waktu, slot, dan action tetap terlihat tanpa horizontal scroll. (Task 2)
- Full match: tidak tampil sebagai available atau `Join this game`. (Task 2)
- No upcoming match: homepage menggunakan fallback Schedule, bukan URL dengan ID kosong. (Task 1)
- Archive image unavailable: news/gallery tetap memiliki fallback yang dapat dibaca. (Task 3)
- Color contrast: red/green hanya menjadi accent dan body text tetap ink/ivory. (Task 1)

---

### Task 1: Color tokens and homepage tour-board foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/views/home-view.tsx`
- Test: existing browser/runtime verification; no new unit test unless a pure helper is introduced.

**Interfaces:**
- Consumes: existing `HomeViewProps`, `nextMatch`, news, albums, and FAQ data.
- Produces: stable color tokens and homepage sections labeled `Next show`, activity/tour metadata, and community CTA.

- [ ] **Step 1: Map existing theme tokens and identify duplicate colors**

  Keep current token names where they are already used. Add or normalize only the missing purpose tokens from the spec: paper, paper-raised, ink, ink-soft, red, red-soft, field, and line.

- [ ] **Step 2: Implement the color system in `globals.css`**

  Use exact values from the spec. Ensure body text remains ink/secondary text and avoid globally recoloring every accent to red or green.

- [ ] **Step 3: Convert homepage copy/labels to the band-club vocabulary**

  Use `Next show`, `Upcoming dates`, `From the pitch`, `The Clash archive`, and `Keep up with Clash` only where the corresponding existing content exists. Do not invent news or album data.

- [ ] **Step 4: Add/adjust tour metadata strip and community entry point**

  Preserve the current activity information and route links. Ensure the strip stacks at mobile width and the main action remains visible.

- [ ] **Step 5: Verify homepage data states**

  Check a populated next match and the no-match branch. Confirm CTA href is based on the displayed match ID or `/schedule` fallback.

### Task 2: Tour-date schedule and poster fixture cards

**Files:**
- Modify: `src/components/match-card.tsx`
- Modify: `src/components/views/schedule-view.tsx`
- Modify: `src/components/views/home-view.tsx` only if shared fixture preview needs alignment.

**Interfaces:**
- Consumes: existing `Match` type, `formatDate`, `formatTime`, and match detail route.
- Produces: responsive fixture card/list showing date hierarchy, venue, time, capacity, and truthful action state.

- [ ] **Step 1: Define display states from existing match fields**

  Derive available/full labels from `slotsAvailable` and `slotsTotal`; do not alter server-side capacity behavior.

- [ ] **Step 2: Recompose `MatchCard` as a poster/scorecard hybrid**

  Make date/month and match title prominent, keep venue/time/slots in a readable metadata block, and use functional icons only. Keep the whole card link behavior intact.

- [ ] **Step 3: Use explicit actions for available and full fixtures**

  Available matches use `Join this game` or `Open fixture`; full matches use `View fixture`. Do not create a disabled fake action that prevents access to fixture details.

- [ ] **Step 4: Reframe Schedule as upcoming tour dates plus archive**

  Keep existing upcoming/past toggle and empty state. Update heading/labels without changing data ordering or routes.

- [ ] **Step 5: Verify mobile fixture behavior**

  Inspect `/schedule` at mobile and desktop widths. Confirm long titles/locations wrap, all information remains visible, and no horizontal overflow occurs.

### Task 3: Fan archive and community layer

**Files:**
- Modify: `src/components/views/home-view.tsx`
- Modify: `src/components/views/news-view.tsx` if the page has a public heading component.
- Modify: `src/components/views/gallery-view.tsx` if the page has a public heading component.
- Modify: `src/components/footer.tsx`

**Interfaces:**
- Consumes: existing news/albums/settings and fallback content components.
- Produces: archive vocabulary, social/community CTA, and consistent footer treatment.

- [ ] **Step 1: Rename public section headings without changing data**

  Use `From the pitch` for news and `The Clash archive` for gallery. Preserve item titles, excerpts, dates, image URLs, and links.

- [ ] **Step 2: Strengthen archive card hierarchy**

  Keep `BrandFallback` for missing images, ensure alt text remains meaningful, and use image-first treatment where existing images are available.

- [ ] **Step 3: Update footer community layer**

  Introduce `Keep up with Clash` as the social/contact framing while preserving existing Instagram, WhatsApp, and navigation URLs.

- [ ] **Step 4: Verify archive fallback states**

  Inspect missing-image/news/gallery states and confirm readable fallback content, no broken images, and no broken links.

### Task 4: Verification and finish gate

**Files:**
- Modify only if verification finds a regression in Tasks 1–3.

- [ ] **Step 1: Run unit tests**

  Run `npm test`; expected: all existing tests pass.

- [ ] **Step 2: Run lint and typecheck**

  Run `npm run lint` and `npx tsc --noEmit`; expected: no errors.

- [ ] **Step 3: Run production build**

  Run `npm run build`; expected: build succeeds without database access.

- [ ] **Step 4: Verify browser routes and visual states**

  Check `/`, `/schedule`, `/news`, `/gallery`, `/faq`, `/about`, and `/contact` in desktop and mobile. Check console messages, images, CTA links, and horizontal overflow.

- [ ] **Step 5: Run diff hygiene check**

  Run `git diff --check` and review that no backend/schema/auth files changed.
