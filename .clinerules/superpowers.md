# Superpowers workflow for Clash.Soccer

Use this workflow for every non-trivial coding task. It adapts the core practices from obra/superpowers to this project; it is a project rule, not an official Cline plugin.

## 1. Understand before editing

- Restate the requested outcome and identify acceptance criteria.
- Inspect the relevant files, existing patterns, and `AGENTS.md` before proposing code.
- For ambiguous or broad requests, ask focused questions or present a short design before implementation.
- Prefer the smallest change that satisfies the requirement. Do not add dependencies or speculative abstractions.

## 2. Plan the work

- Break implementation into small, verifiable steps.
- Identify affected routes, components, API handlers, database code, and documentation before editing.
- Preserve the existing API envelope `{ success, data, error }`, Zod validation, parameterized SQL, and JWT/httpOnly-cookie security conventions.
- For Next.js work, read the relevant guide under `node_modules/next/dist/docs/` before changing framework behavior, as required by `AGENTS.md`.

## 3. Test-driven implementation

- Write or update a focused test before implementation whenever a test harness exists.
- Follow RED → GREEN → REFACTOR: first reproduce the expected behavior, make the smallest fix, then simplify without changing behavior.
- If no test framework exists for the seam, state that limitation and compensate with lint, type checking, build validation, and targeted manual checks.
- Do not weaken or delete tests merely to make them pass.

## 4. Systematic debugging

- Reproduce the problem and capture the exact error or failing behavior.
- Trace from the symptom to the root cause; do not patch only the visible symptom.
- Form a falsifiable hypothesis, make one focused change, and rerun the reproducer.
- Check nearby failure modes and security boundaries, especially authentication, authorization, input validation, SQL, and environment variables.

## 5. Review before completion

- Review the diff for correctness, scope creep, regressions, accessibility, responsive UI behavior, and security issues.
- Verify edge cases and error paths, not only the happy path.
- Run the most relevant checks, then the project checks available in `package.json` (at minimum `npm run lint`; use `npm run build` when practical).
- Never claim completion without reporting what was verified and any remaining limitation.

## Project commands and conventions

- Development: `npm run dev`
- Lint: `npm run lint`
- Production build: `npm run build`
- Database initialization: `npm run db:init`
- Use the existing Next.js, React, TypeScript, Tailwind, PostgreSQL, `pg`, `jose`, and Zod stack. Confirm a library is already installed before using it.
- Keep secrets in environment variables; never commit `.env` files, credentials, or generated artifacts.

## Response format for completed work

Summarize the changes, list files touched, report validation commands and results, and clearly call out assumptions or follow-up work.