-- =====================================================================
-- MWA Quiz Registration — schema
--
-- Tables
--   competition_settings  singleton row: open/closed, capacity, age rules
--   teams                 one row per registered team
--   team_members          exactly three rows per team
--   admin_profiles        which auth users are organisers
--
-- Writes from the public site go only through public.register_team()
-- (see the functions migration). Row Level Security is in the rls migration.
-- =====================================================================

-- Internal helpers live in a schema that is not exposed through the Data API.
create schema if not exists private;
revoke all on schema private from public;

create type public.registration_status as enum ('submitted', 'verified', 'rejected', 'cancelled');
create type public.participant_status as enum ('student', 'working');

-- ---------------------------------------------------------------------
-- competition_settings
-- ---------------------------------------------------------------------
create table public.competition_settings (
  id smallint primary key default 1 constraint competition_settings_singleton check (id = 1),
  registration_open boolean not null default true,
  maximum_teams smallint not null default 15 check (maximum_teams between 1 and 100),
  -- Age is evaluated on this date.
  -- TODO(organisers): placeholder; must match EVENT.date in src/config/event.ts.
  competition_date date not null,
  min_age smallint not null default 19,
  max_age smallint not null default 26,
  -- Next registration number (MWA-001, MWA-002, ...). Only advanced by register_team().
  next_registration_seq integer not null default 1 check (next_registration_seq >= 1),
  updated_at timestamptz not null default now(),
  constraint competition_settings_age_range check (min_age <= max_age)
);

comment on table public.competition_settings is
  'Singleton (id = 1). The database is the authority for registration open/closed and capacity.';

insert into public.competition_settings (id, competition_date)
values (1, date '2026-11-15')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique
    constraint teams_registration_number_format check (registration_number ~ '^MWA-[0-9]{3,}$'),
  status public.registration_status not null default 'submitted',
  admin_note text constraint teams_admin_note_length check (char_length(admin_note) <= 500),
  -- Client-generated id of the registration draft; makes submission idempotent and
  -- scopes the Aadhaar upload paths (submissions/<submission_id>/...).
  submission_id uuid not null unique,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teams_status_idx on public.teams (status);

-- ---------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  member_number smallint not null constraint team_members_member_number check (member_number between 1 and 3),
  full_name text not null constraint team_members_full_name check (char_length(btrim(full_name)) between 3 and 80),
  -- Stored normalised: 10 digits, no +91 / leading 0.
  mobile_number text not null constraint team_members_mobile check (mobile_number ~ '^[6-9][0-9]{9}$'),
  date_of_birth date not null,
  residential_address text not null
    constraint team_members_address check (char_length(btrim(residential_address)) between 10 and 300),
  district text not null constraint team_members_district check (district in ('Dakshina Kannada', 'Udupi')),
  participant_status public.participant_status not null,
  course_details text check (char_length(course_details) <= 120),
  institution text check (char_length(institution) <= 120),
  occupation text check (char_length(occupation) <= 120),
  employer text check (char_length(employer) <= 120),
  studying_in_madrasa boolean not null,
  is_aalim boolean not null,
  -- Private storage reference only; never a URL, never document contents.
  aadhaar_storage_path text not null unique,
  aadhaar_file_name text not null check (char_length(aadhaar_file_name) between 1 and 255),
  aadhaar_size_bytes integer not null check (aadhaar_size_bytes between 1 and 2097152),
  aadhaar_mime_type text not null check (aadhaar_mime_type in ('image/jpeg', 'image/png', 'application/pdf')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_unique_number unique (team_id, member_number),
  constraint team_members_unique_mobile_in_team unique (team_id, mobile_number),
  constraint team_members_status_details check (
    (participant_status = 'student'
      and nullif(btrim(course_details), '') is not null
      and nullif(btrim(institution), '') is not null)
    or (participant_status = 'working'
      and nullif(btrim(occupation), '') is not null
      and nullif(btrim(employer), '') is not null)
  ),
  -- Competition rule: Madrasa students and Aalims are not eligible.
  constraint team_members_eligible check (not studying_in_madrasa and not is_aalim)
);

-- Duplicate-participant lookups by mobile.
create index team_members_mobile_idx on public.team_members (mobile_number);

-- ---------------------------------------------------------------------
-- admin_profiles — authentication is not authorisation: only users listed here are organisers.
-- ---------------------------------------------------------------------
create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Organiser',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger competition_settings_updated_at before update on public.competition_settings
  for each row execute function private.set_updated_at();
create trigger teams_updated_at before update on public.teams
  for each row execute function private.set_updated_at();
create trigger team_members_updated_at before update on public.team_members
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Every team has exactly three members, checked at commit time.
-- ---------------------------------------------------------------------
create function private.check_team_size()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_count integer;
begin
  if tg_table_name = 'teams' then
    v_team_id := new.id;
  elsif tg_op = 'DELETE' then
    v_team_id := old.team_id;
  else
    v_team_id := new.team_id;
  end if;

  -- A team deleted in the same transaction (cascade) has nothing left to check.
  if not exists (select 1 from public.teams where id = v_team_id) then
    return null;
  end if;

  select count(*) into v_count from public.team_members where team_id = v_team_id;
  if v_count <> 3 then
    raise exception 'Team % must have exactly 3 members (has %)', v_team_id, v_count
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger teams_have_three_members
  after insert on public.teams
  deferrable initially deferred
  for each row execute function private.check_team_size();

create constraint trigger team_members_keep_three
  after insert or delete on public.team_members
  deferrable initially deferred
  for each row execute function private.check_team_size();
