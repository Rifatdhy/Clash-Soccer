# Clash.Soccer Risk Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Menutup risiko integritas database, autentikasi, state UI, aksesibilitas, logging, dan query performance yang ditemukan dalam audit total.

**Architecture:** Tambahkan helper transaction berbasis satu `pg.PoolClient`, lalu migrasikan route yang memakai transaction. Perbaiki state dan kontrol UI secara lokal dengan primitive dialog sederhana agar perilaku keyboard konsisten tanpa redesign visual. Tambahkan test minimum pada seam database/auth dan verifikasi statis untuk UI.

**Tech Stack:** Next.js 16, React 19, TypeScript, PostgreSQL `pg`, Zod, Framer Motion, ESLint.

**Spec:** `docs/superpowers/specs/2026-11-07-clash-soccer-risk-hardening-design.md`

## Global Constraints

- Pertahankan alur bisnis dan visual utama aplikasi.
- Tidak ada secret fallback yang tertanam untuk environment non-test.
- Semua transaction memakai satu PostgreSQL client sampai commit atau rollback selesai.
- Kontrol aksi memakai elemen native dan dapat dioperasikan dengan keyboard.
- Loading, error, not-found, dan success state harus dibedakan.
- Jangan mencetak parameter database mentah yang dapat memuat PII.
- Jalankan lint, typecheck, build, dan test sebelum menyatakan selesai.

## Review Focus

- RSVP bersamaan tidak boleh melampaui slot karena lock dan update berada pada koneksi yang sama. Test pada Task 1.
- Callback transaction yang gagal harus rollback dan client harus selalu dilepas. Test pada Task 1.
- Environment tanpa `ADMIN_AUTH_SECRET` tidak boleh menghasilkan token memakai secret publik. Test pada Task 2.
- Request detail yang lambat tidak boleh ditampilkan sebagai not-found sebelum selesai. Test/state inspection pada Task 3.
- Dialog harus dapat ditutup dengan Escape dan memiliki accessible name. Test/state inspection pada Task 4.

---

### Task 1: Transaction helper dan migrasi route database

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/app/api/rsvps/route.ts`
- Modify: `src/app/api/albums/route.ts`
- Modify: `src/app/api/settings/route.ts`
- Create: `src/lib/db-transaction.test.ts` (only if a test runner is installed or added)

**Interfaces:**
- Produces: `withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>` from `src/lib/db.ts`.
- Consumes: existing `pool` and query result types.

- [ ] **Step 1: Write the failing transaction tests**
  - Assert callback queries use the same client instance.
  - Assert callback failure calls rollback and release.
  - Assert callback success calls commit and release.

- [ ] **Step 2: Run the focused test and verify it fails for the missing helper**
  - Run the repository’s configured test command for the focused file.
  - Expected: failure because `withTransaction` does not exist or does not preserve one client.

- [ ] **Step 3: Implement `withTransaction` in `src/lib/db.ts`**
  - Acquire with `pool.connect()`.
  - Run `BEGIN`, callback, `COMMIT` on the same client.
  - On failure run `ROLLBACK`, rethrow, and always call `release()`.

- [ ] **Step 4: Migrate RSVP, album creation, and settings update**
  - Replace separated `query("BEGIN")`, transaction queries, and `query("COMMIT"/"ROLLBACK")` with `withTransaction`.
  - Keep response behavior and validation unchanged.

- [ ] **Step 5: Run focused tests and typecheck**
  - Expected: transaction tests pass and `npx tsc --noEmit` exits 0.

### Task 2: Authentication configuration and environment documentation

**Files:**
- Modify: `src/lib/admin-auth.ts`
- Modify: `README.md`
- Create: `.env.example`
- Create: `src/lib/admin-auth.test.ts` (only if a test runner is installed or added)

**Interfaces:**
- Consumes: existing `createAdminSessionToken` and `verifyAdminSessionToken`.
- Produces: deterministic configuration failure when `ADMIN_AUTH_SECRET` is absent outside test mode.

- [ ] **Step 1: Write the failing auth configuration test**
  - Assert token creation without `ADMIN_AUTH_SECRET` throws outside test mode.
  - Assert no known source fallback is used.

- [ ] **Step 2: Run the focused test and verify the expected failure**

- [ ] **Step 3: Remove the hardcoded fallback**
  - Require `ADMIN_AUTH_SECRET` for development, staging, and production.
  - Allow an explicit test-only setup only if the test environment provides it.

- [ ] **Step 4: Add `.env.example` and update README**
  - Document all variables already listed by the project.
  - Do not include real credentials or a usable default secret.

- [ ] **Step 5: Run the focused test and lint**
  - Expected: auth test passes and `npm run lint` exits 0.

### Task 3: Correct async loading and error states

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/schedule/[id]/page.tsx`
- Modify: `src/app/gallery/[id]/page.tsx`
- Modify: `src/app/news/[slug]/page.tsx`
- Use: `src/components/content-state.tsx`

**Interfaces:**
- Produces: explicit loading, error, not-found, and data branches for each async detail/home view.

- [ ] **Step 1: Add explicit state variables before changing render branches**
  - Use `isLoading`, `error`, and nullable data state.
  - Add a retry action where the request can be repeated.

- [ ] **Step 2: Verify the old behavior is represented by a failing state test or static assertion**
  - The assertion must demonstrate that a pending request does not render not-found content.

- [ ] **Step 3: Implement the four-state render branches**
  - Pending request renders `LoadingState`.
  - Failed request renders `ErrorState`.
  - Successful empty detail response renders not-found.
  - Successful data renders existing content.

- [ ] **Step 4: Run typecheck and lint**
  - Expected: both exit 0.

### Task 4: Accessible controls, dialogs, and form labels

**Files:**
- Create: `src/components/dialog.tsx`
- Modify: `src/app/gallery/[id]/page.tsx`
- Modify: `src/app/admin/gallery/page.tsx`
- Modify: `src/app/admin/matches/page.tsx`
- Modify: `src/app/admin/news/page.tsx`
- Modify: `src/app/admin/settings/page.tsx`
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/date-picker.tsx`
- Modify: `src/app/schedule/[id]/page.tsx`

**Interfaces:**
- Produces: reusable dialog behavior with `role="dialog"`, `aria-modal`, accessible title, Escape close, and close button.

- [ ] **Step 1: Write the failing accessibility checks**
  - Check dialog markup has accessible name and `aria-modal`.
  - Check Escape closes the dialog.
  - Check gallery item activation uses a native button.
  - Check form labels have matching `htmlFor` and input `id`.

- [ ] **Step 2: Run checks and verify they fail against current markup**

- [ ] **Step 3: Implement the dialog primitive**
  - Use native button close control with an accessible label.
  - Add Escape listener while open.
  - Keep existing styling passed through className.
  - Do not introduce a focus trap unless needed by existing layout; ensure focusable close control is present.

- [ ] **Step 4: Migrate lightbox and admin modal patterns**
  - Replace clickable `div` controls with buttons.
  - Add `aria-expanded` and `aria-controls` to public and admin mobile menus.
  - Add labels to icon-only date picker, edit, delete, and close controls.

- [ ] **Step 5: Connect all visible form labels**
  - Add stable unique IDs and matching `htmlFor` across RSVP and admin forms.

- [ ] **Step 6: Run lint, typecheck, and static accessibility checks**

### Task 5: RSVP inline validation and error feedback

**Files:**
- Modify: `src/app/schedule/[id]/page.tsx`
- Modify: `src/components/content-state.tsx` only if a shared inline error primitive is needed

**Interfaces:**
- Produces: inline RSVP error with `role="alert"`, no browser `alert()`.

- [ ] **Step 1: Write the failing behavior test/check**
  - Empty participant fields produce visible field feedback.
  - Failed submit renders an inline alert and preserves entered participants.

- [ ] **Step 2: Run the check and verify the current `alert()` behavior fails it**

- [ ] **Step 3: Implement client validation and inline submit error**
  - Add required constraints and controlled error state.
  - Clear the error only after a new valid attempt.
  - Preserve the existing success state.

- [ ] **Step 4: Run lint and typecheck**

### Task 6: Logging redaction and album query performance

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/app/api/albums/route.ts`

**Interfaces:**
- Produces: database errors without raw parameter logging and album reads without one query per album.

- [ ] **Step 1: Write the failing query-shape check**
  - Assert album list retrieval does not execute a child-item query inside a per-album loop.
  - Assert database error logging omits raw `params`.

- [ ] **Step 2: Run the check and verify it fails against current implementation**

- [ ] **Step 3: Implement batch album item retrieval**
  - Fetch albums once and items once, or use a join.
  - Group items by album ID before mapping.

- [ ] **Step 4: Redact database parameter logs**
  - Keep query text, duration, row count, and safe error context.
  - Remove raw params from logs.

- [ ] **Step 5: Run lint, typecheck, and build**

### Task 7: Full verification and review

**Files:**
- Modify: only files required by verification findings.

- [ ] **Step 1: Run the full test command**

- [ ] **Step 2: Run `npm run lint`**

- [ ] **Step 3: Run `npx tsc --noEmit`**

- [ ] **Step 4: Run `npm run build`**

- [ ] **Step 5: Inspect `git diff --check`, `git diff`, and `git status --short`**
  - Confirm no unrelated user changes were reverted.

- [ ] **Step 6: Run code review against the completed hardening diff**
  - Report remaining findings separately for standards and spec.
