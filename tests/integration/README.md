# Integration tests (real Supabase project)

These tests run against the live project configured in `.env.local` and sign in with the test
admin from `.env.test.local` (both gitignored). They cover RLS/storage security, `register_team`
rules, the final-slot race and admin actions.

```bash
npm run test:integration
```

Each test deletes the teams and uploads it creates (`admin_delete_team` + Storage remove) and restores
any settings it changes (`registration_open`, `maximum_teams`).

**Do not run once real registrations are open**: the race tests temporarily lower
`maximum_teams`, which would briefly block real participants.

**Before launch**, registration numbers used by test runs must be reset (numbers are never reused
while teams exist). Run as the database owner (SQL editor / MCP), only when no real teams exist:

```sql
update public.competition_settings set next_registration_seq = 1
where id = 1 and not exists (select 1 from public.teams);
```
