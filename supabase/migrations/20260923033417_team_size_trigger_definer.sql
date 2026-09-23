-- =====================================================================
-- Fix: the "exactly three members" constraint trigger is DEFERRED, so it fires at COMMIT —
-- after register_team() (SECURITY DEFINER) has returned — and therefore runs as the calling
-- role (anon). anon has no table privileges, so every successful registration failed with
-- "permission denied for table teams".
--
-- The trigger function only counts rows. Running it as its owner is safe: it lives in the
-- unexposed private schema, has no EXECUTE grants and cannot be called through the API.
-- =====================================================================
alter function private.check_team_size() security definer;
