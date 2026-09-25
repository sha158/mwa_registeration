# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Registration site for the MWA Youth Quiz: public 3-member team registration flow + organiser admin console. React 19, TypeScript, Vite, Tailwind v4, React Router (data router), Zustand, react-hook-form + Zod. Backend is Supabase only (Postgres RPCs, RLS, Storage); hosted as a static-assets-only Cloudflare Worker.

Note: README.md still describes the earlier mock-only phase. Supabase is now the default backend.

## Commands

```bash
npm run dev                 # http://localhost:5173 (needs .env.local, see .env.example)
npm run lint                # eslint
npm run typecheck           # tsc -b
npm test                    # unit tests: src/**/*.test.ts
npm run test:integration    # against the LIVE Supabase project (see below)
npm run build               # tsc -b && vite build -> dist/

npx vitest run src/domain/age.test.ts        # single unit test file
npx vitest run -t "name of test"             # single test by name
```

Full pre-commit check: `npm run lint && npm run typecheck && npm test && npm run build`.

Node 24 (`.node-version`). Deploy: `dist/` served by `wrangler.jsonc` with SPA `not_found_handling` so deep links like `/admin/teams/:id` resolve.

### Mock mode (dev only)

Set `VITE_USE_MOCKS=true` in `.env.local` to run on in-memory mocks (reset on reload). Mock admin: `admin@mwa.test` / `mwa-admin`. Failure scenarios: `VITE_MOCK_SCENARIO` or in dev console `mwaMock.setScenario('full' | 'network' | 'duplicate' | 'upload-fail' | 'none')`.

### Integration tests

`tests/integration/` hits the real Supabase project using `.env.local` + `.env.test.local` (`TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`). Run serially, clean up after themselves. **Do not run once real registrations are open** — race tests temporarily lower `maximum_teams`. Registration sequence must be reset before launch (SQL in `tests/integration/README.md`).

## Architecture

**Service layer is the seam.** UI never touches Supabase directly. It imports from `@/services`, which exports implementations of the interfaces in `src/services/types.ts`. `src/services/index.ts` picks Supabase (`src/services/supabase/`) or mocks (`src/services/mock/`, dynamically imported only when `import.meta.env.DEV && VITE_USE_MOCKS`, so they're never bundled in prod). Any new backend capability: add to the interface in `types.ts`, then implement in both `supabase/` and `mock/`.

- `src/services/supabase/database.types.ts` is generated (Supabase MCP `generate_typescript_types`) — never hand-edit; regenerate after schema changes. Only used inside `src/services/supabase/` and tests. UI uses domain types from `src/types/domain.ts`; `mappers.ts` converts between them.
- Errors: services throw `ServiceError` with a fixed code set. `errors.ts#toServiceError` maps Supabase errors (no code/status = network). Raw backend messages never reach the UI. `submitRegistration` never throws for expected outcomes — returns a `SubmitResult` union.
- `src/lib/supabase.ts`: single browser client, publishable key only. All authorization is enforced in the database.

**Database (`supabase/migrations/`).** All writes go through `security definer` RPCs, not table writes:
- `register_team(p_submission_id, p_members, p_consent)` — transactional; re-checks open/capacity, validates age/mobile/duplicates, verifies Aadhaar storage objects exist, assigns registration number. Idempotent on `submission_id`.
- Aadhaar rule: every member has a front document (`aadhaar_*` columns); a back (`aadhaar_back_*`) is required unless the front is the e-Aadhaar PDF. Enforced by table constraints + `private.aadhaar_object()` in `register_team`, and mirrored by the `AadhaarDocuments` union (`kind: 'photos' | 'pdf'`) in `src/types/domain.ts`.
- `get_registration_availability`, `admin_*` functions (stats, set status, delete team, orphan uploads).
- Helpers live in the `private` schema (`private.is_admin()` checks `admin_profiles`). Table privileges start from `revoke all`; anon gets only RPC execute. Admins read via RLS policies.
- Storage bucket `aadhaar-documents` is private. Anon may upload only under `submissions/<submissionId>/member-<n>/...`; admins read via short-lived signed URLs (fetched into an object URL by `documentService.getSignedUrl`).
- Schema changes: new migration file in `supabase/migrations/`, then regenerate types. Server rules must mirror client rules in `src/domain/` + `src/validation/` (client checks are UX only; server is authoritative).

**Routing (`src/app/router.tsx`, `loaders.ts`).** React Router data router with lazy pages. Guards are loaders, not components:
- Registration steps `/register/member/:n` → `/register/review` → `/register/success`; loaders redirect to the first incomplete member using the Zustand store state.
- Admin routes protected by `requireAdminMiddleware` (middleware, because parallel child loaders would otherwise fire before a parent-loader check). Non-organiser signed-in users get `FORBIDDEN` and are signed out on `/admin/login`.
- Custom `shouldRevalidate` avoids refetching availability between registration steps and on `?status` filter changes in admin teams list.

**Registration draft (`src/features/registration/store.ts`).** Zustand persisted to **sessionStorage** (survives mobile reloads, cleared with tab). Holds only text fields, `submissionId`, and opaque upload refs (storage path/name/size) — never file contents or URLs. `submissionId` scopes uploads and makes submit idempotent; regenerated on success/start over. Bump `version` + `migrate` if the persisted shape changes.

**Domain rules.** `src/config/event.ts` is the single source of truth for event facts and limits (team size 3, age 19–26 evaluated on `EVENT.date`, max teams, Aadhaar file limits). Several values are placeholder `TODO`s pending organiser confirmation. Pure logic in `src/domain/` (age, availability open/limited/full/closed, team search, Aadhaar PDF password hint) and Zod schemas in `src/validation/` are unit tested. Aadhaar file type is detected from file bytes (`validation/file.ts`), not name/MIME.

**UI.** Shared primitives in `src/components/ui/`, feature components in `src/features/{public,registration,admin}/`, pages in `src/pages/`. Tailwind v4 theme tokens in `src/styles/index.css` (`@theme`), derived from `design/stitch/DESIGN.md` ("Emerald & Parchment"); reference screenshots in `design/stitch/`. Mobile-first — many registrants and admins use Android phones (e.g. inline PDF preview only when `navigator.pdfViewerEnabled`).

## Conventions

- Import alias `@/` → `src/`. Type-only imports must use `import type` (lint error).
- `no-console` except `console.warn`/`console.error`. ESLint includes `jsx-a11y` recommended and `typescript-eslint` strict.
- Supabase project ref `spvysjjtmyknagjnguqq` (Supabase MCP configured in `.mcp.json`). Project-local skills in `.claude/skills/` (supabase, supabase-postgres-best-practices) — load before DB work.
