# MWA Quiz Registration

Registration site for the MWA Youth Quiz: a public 3-member team registration flow and an organiser admin.
React 19 + TypeScript + Vite + Tailwind CSS v4. **Frontend phase: all data is mocked** behind service interfaces, ready for Supabase.

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint && npm run typecheck && npm test && npm run build
```

Mock admin login (dev only): `admin@mwa.test` / `mwa-admin`

Mock scenarios (dev console): `mwaMock.setScenario('full' | 'network' | 'duplicate' | 'upload-fail' | 'none')`, or set `VITE_MOCK_SCENARIO`.
Mock data is in memory and resets on reload.

## Where things live

| Path | Purpose |
| --- | --- |
| `src/config/event.ts` | Event facts and limits. **Placeholders marked TODO** (date, venue, helpline, book). Age is evaluated on `EVENT.date`. |
| `src/types/domain.ts` | Domain types (Team, TeamMember, SubmitResult…) shaped after `teams` / `team_members` / `settings`. |
| `src/domain/` | Pure rules: age, availability (open / limited / full / closed), team search. Unit tested. |
| `src/validation/` | Zod schemas (member, consent, file, mobile). |
| `src/services/types.ts` | Service contracts. |
| `src/services/index.ts` | **The only file to change when wiring Supabase.** |
| `src/services/mock/` | In-memory mock implementations. |
| `src/features/registration/store.ts` | Zustand draft store (sessionStorage, text fields + opaque upload refs only). |
| `src/app/router.tsx`, `loaders.ts` | Routes, route guards and data loading. |
| `design/stitch/` | Stitch reference screenshots and DESIGN.md. |
