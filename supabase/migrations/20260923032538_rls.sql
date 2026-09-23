-- =====================================================================
-- MWA Quiz Registration — privileges and Row Level Security
--
-- Access model
--   anon (participants): no table access at all. May only call
--     get_registration_availability() and register_team().
--   authenticated: table reads and settings updates only when listed in admin_profiles
--     (private.is_admin()). Team status changes go through admin_set_team_status().
-- =====================================================================

-- ---------------------------------------------------------------------
-- RLS on every table in the exposed schema
-- ---------------------------------------------------------------------
alter table public.competition_settings enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.admin_profiles enable row level security;

-- ---------------------------------------------------------------------
-- Table privileges: start from nothing, grant only what policies need.
-- ---------------------------------------------------------------------
revoke all on public.competition_settings, public.teams, public.team_members, public.admin_profiles
  from public, anon, authenticated;

grant select on public.teams, public.team_members, public.competition_settings, public.admin_profiles
  to authenticated;
-- Column-level: admins may open/close registration and adjust capacity, nothing else.
grant update (registration_open, maximum_teams) on public.competition_settings to authenticated;

-- ---------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------
create policy "Admins read teams" on public.teams
  for select to authenticated
  using ((select private.is_admin()));

create policy "Admins read team members" on public.team_members
  for select to authenticated
  using ((select private.is_admin()));

create policy "Admins read settings" on public.competition_settings
  for select to authenticated
  using ((select private.is_admin()));

create policy "Admins update settings" on public.competition_settings
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Users read own admin profile" on public.admin_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Function privileges. Postgres grants EXECUTE to PUBLIC by default; revoke everywhere,
-- then grant explicitly.
-- ---------------------------------------------------------------------
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
-- Needed by RLS policies, storage policies and invoker admin functions.
grant execute on function
  private.is_admin(),
  private.team_occupies_slot(public.registration_status),
  private.occupied_slots(),
  private.fail(text, jsonb)
  to authenticated;

revoke all on function
  public.get_registration_availability(),
  public.register_team(uuid, jsonb, jsonb),
  public.admin_dashboard_stats(),
  public.admin_set_team_status(uuid, public.registration_status, text),
  public.admin_delete_team(uuid),
  public.admin_list_orphan_uploads(interval)
  from public, anon, authenticated;

-- Public registration endpoints
grant execute on function
  public.get_registration_availability(),
  public.register_team(uuid, jsonb, jsonb)
  to anon, authenticated;

-- Admin endpoints (each re-checks private.is_admin())
grant execute on function
  public.admin_dashboard_stats(),
  public.admin_set_team_status(uuid, public.registration_status, text),
  public.admin_delete_team(uuid),
  public.admin_list_orphan_uploads(interval)
  to authenticated;
