# Clash.Soccer Audit Remediation Plan

> **For agentic workers:** Use `executing-plans` and work task by task. Steps use `- [x]`.

**Goal:** Fix every finding in the 2026-11-09 repo audit: data integrity, broken admin flows, security, performance, SEO, tests, dead code, and accessibility.

**Architecture:** Keep the existing Next.js App Router structure. Add a server-only data layer that pages call directly (SSR + one batched album query), keep admin pages client-side, add a real transaction helper, and make all client stores fail loudly instead of returning fake data.

**Tech Stack:** Next.js 16.2, React 19, TypeScript 5, PostgreSQL (`pg`), Zod 4, Node 24 test runner.

**Spec:** `docs/superpowers/specs/2026-11-04-clash-soccer-technopreneurship-design.md` plus the audit report in the session.

## Global Constraints

- Never return fabricated content when a request fails.
- Every DB write that touches more than one row runs inside `withTransaction`.
- Admin image uploads are compressed in the browser and capped server-side.
- Public pages must render their content in the server HTML.
- All new pure logic gets a failing test before implementation.
- `npm run build`, `npx tsc --noEmit`, `npm run lint`, and `npm test` must pass.

## Tasks

### Task 1: Pure helpers with tests
- [x] Write `tests/slots.test.ts`, `tests/validation.test.ts`, `tests/rate-limit.test.ts` (failing first).
- [x] Add `src/lib/slots.ts`, `src/lib/validation.ts`.
- [x] Rewrite `src/lib/rate-limit.ts` with bounded buckets and scopes.
- [x] Run `npm test`.

### Task 2: Database layer
- [x] Add `withTransaction` to `src/lib/db.ts`; stop killing the process on idle pool errors.
- [x] Add `src/lib/data.ts` (server reads, batched album items, 30s cache + invalidation).
- [x] Move RSVP, settings, album writes onto `withTransaction`.

### Task 3: API correctness
- [x] Album item POST generates id, requires albumId, returns full album; DELETE accepts `id`.
- [x] Album PUT accepts `id` in the body.
- [x] News accepts empty cover and excerpt; duplicate slug returns 409.
- [x] `initDatabase` rethrows; `/api/db-init` returns 500 on failure.
- [x] RSVP: rate limit, duplicate WhatsApp per match, transactional slot updates.

### Task 4: Admin UI
- [x] Match edit preserves `slotsAvailable`; status select added.
- [x] Gallery: update sends id, add/delete item fixed, delete confirm, save on blur.
- [x] News: errors surfaced, upload compressed, empty cover allowed.
- [x] Settings: logo/banner compressed, FAQ saved on blur.
- [x] Login: `next` sanitized.
- [x] Stores throw on failure; mock news removed.

### Task 5: Public pages server-rendered
- [x] Root `error.tsx` and `not-found.tsx`.
- [x] Convert `/`, `/schedule`, `/schedule/[id]`, `/gallery`, `/gallery/[id]`, `/news`, `/news/[slug]`, `/faq`, `/about`, `/contact` to server pages with client views.
- [x] Add `generateMetadata` for news and album detail.
- [x] Fix detail "not found" flash and add loading states.

### Task 6: Security and performance
- [x] RSVP and login rate limits.
- [x] Image URL allowlist validated server-side and in admin forms.
- [x] Delete dead code (`db-helpers.ts`, `admin-navbar.tsx`), trim unused exports, share InstagramIcon.

### Task 7: Accessibility
- [x] Labels/`htmlFor` on login, RSVP form, admin inputs.
- [x] `aria-label` on icon-only buttons.

### Task 8: Verify
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- [ ] Manual smoke of admin flows against a database if available. (No database in this environment; covered by build + type check only.)
