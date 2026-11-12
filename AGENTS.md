<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 repository

Before changing Next.js code, read the relevant guide under `node_modules/next/dist/docs/`; this version has breaking changes from older Next.js releases.
<!-- END:nextjs-agent-rules -->

# Clash.Soccer agent instructions

## Toolchain and commands

- Use Node.js 24 and `npm ci` for a clean install; the project is ESM (`"type": "module"`).
- Normal verification order is: `npm run lint`, `npx tsc --noEmit`, `npm test`, then `npm run build`.
- Unit tests are `node --test "tests/*.test.ts"`; run one with `node --test tests/<name>.test.ts`. They do not need a database.
- Integration tests need `TEST_DATABASE_URL`; set it to a disposable PostgreSQL database, run `npm run db:migrate`, then `npm run test:integration`.
- `npm run test:e2e` runs Chromium with one worker and starts the dev server on `127.0.0.1:3000` using the E2E credentials in `playwright.config.ts`.
- Outside CI, Playwright reuses an existing server. Stop any manually started process listening on port 3000 before E2E, otherwise admin tests may use the wrong `.env.local` credentials.
- Do not run `npm run build` and E2E concurrently; both mutate `.next`. If generated `.next` types/cache become corrupt, stop dev processes and remove `.next` before rerunning serially.
- `npm run dev` serves `http://localhost:3000`; `npm run start` serves the production build.

## Database and environment

- Local PostgreSQL can be started with `docker compose up -d`; migrations are applied with `npm run db:migrate`.
- Required production variables are `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_AUTH_SECRET` (at least 32 characters), one of `ADMIN_PASSWORD_HASH` or `ADMIN_PASSWORD`, and `SITE_URL`.
- `DATABASE_URL` for local PostgreSQL may need `?sslmode=disable`; `UPLOAD_DIR` defaults to `.data/uploads`.
- `npm run build` must work without a database; environment validation skips database access during `NEXT_PHASE=phase-production-build`.
- Never use a real or important database for integration tests, `seed:demo -- --reset`, or `smoke:db`.

## Repository boundaries

- `src/app` contains App Router pages and API route handlers; `src/components` contains UI; `src/lib` contains server/shared logic; `src/types/index.ts` contains shared types.
- `migrations/` contains sequential immutable SQL files (`NNNN_name.sql`); add a new migration instead of editing an applied file.
- `scripts/` contains database, seed, password, and utility entrypoints; `tests/` contains unit/integration tests; `e2e/` contains Playwright tests.
- Public page reads go through `src/lib/data.ts`, which uses the global cache in `src/lib/data-cache.ts`; every write must call `invalidateDataCache()`.
- `src/lib/rsvp-service.ts` locks the match row with `FOR UPDATE` while changing RSVP counts; preserve equivalent serialization when modifying it.
- `src/proxy.ts` guards `/admin/**`, adds the CSP nonce and request ID; API handlers still require `requireAdmin()` as defense in depth.
- `src/lib/storage.ts` supports local/S3 drivers, but uploads are always served through `/api/uploads/<key>`.

## Required implementation conventions

- API routes return the standard envelope: `{ success: true, data, error: null }` or `{ success: false, error, data: null }`; use helpers from `src/lib/api-helpers.ts` instead of raw JSON responses.
- Route input uses Zod schemas through `validate()`; it enforces the JSON body limit, including streamed/chunked requests.
- Use `createLogger()` from `src/lib/logger.ts` in routes and libraries; do not add direct `console.log`, `console.warn`, or `console.error` there.
- Keep both proxy authentication and route-level authorization. The admin session is an `httpOnly` JWT cookie and must not be manipulated from client JavaScript.
- Uploads are identified by file signatures and normalized with `sharp`; keep the upload route on the Node runtime. Use random upload keys and call storage cleanup helpers whenever an image reference is removed or replaced.
- Login and RSVP rate limits are intentional (`5/15 min` and `20/15 min`); both return `Retry-After`. Use `RATE_LIMIT_STORE=database` for multi-instance deployments.
- Use the `@/*` alias for imports from `src/*`.
