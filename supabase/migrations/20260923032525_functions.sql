-- =====================================================================
-- MWA Quiz Registration — functions
--
-- Business rules enforced by the database. The frontend validates the same rules for UX,
-- but these functions are the authority.
--
-- Expected outcomes are returned as jsonb { ok: false, error: '<CODE>' } rather than raised,
-- so clients never see raw SQL errors:
--   REGISTRATION_CLOSED, REGISTRATION_FULL, DUPLICATE_PARTICIPANT, INVALID_ELIGIBILITY,
--   INVALID_TEAM_SIZE, INVALID_INPUT, INVALID_DOCUMENT, FORBIDDEN, NOT_FOUND
-- =====================================================================

-- ---------------------------------------------------------------------
-- Single source of truth: which team statuses occupy one of the limited slots.
-- TODO(client): confirm. Current assumption: rejected and cancelled teams release their slot.
-- Change only this function to change the rule everywhere (registration, availability, stats).
-- ---------------------------------------------------------------------
create function private.team_occupies_slot(p_status public.registration_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_status in ('submitted'::public.registration_status, 'verified'::public.registration_status);
$$;

create function private.occupied_slots()
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer from public.teams t where private.team_occupies_slot(t.status);
$$;

-- Mirrors normaliseMobile() in src/validation/mobile.ts: digits only, drop +91 / leading 0.
create function private.normalize_mobile(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when length(d) = 12 and left(d, 2) = '91' then substr(d, 3)
    when length(d) = 11 and left(d, 1) = '0' then substr(d, 2)
    else d
  end
  from (select regexp_replace(coalesce(p_value, ''), '[^0-9]', '', 'g') as d) as digits;
$$;

-- Is the calling user an organiser? SECURITY DEFINER so RLS policies can use it cheaply.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_profiles where user_id = (select auth.uid()));
$$;

create function private.fail(p_code text, p_detail jsonb default '{}'::jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object('ok', false, 'error', p_code) || coalesce(p_detail, '{}'::jsonb);
$$;

-- ---------------------------------------------------------------------
-- Public: availability for the landing page. Exposes counts only.
-- ---------------------------------------------------------------------
create function public.get_registration_availability()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'registration_open', s.registration_open,
    'maximum_teams', s.maximum_teams,
    'registered_teams', o.n,
    'slots_remaining', greatest(s.maximum_teams - o.n, 0)
  )
  from public.competition_settings s
  cross join (select private.occupied_slots() as n) o
  where s.id = 1;
$$;

-- ---------------------------------------------------------------------
-- Public: register a complete 3-member team atomically.
--
-- p_members: jsonb array of 3 objects with keys
--   member_number, full_name, mobile_number, date_of_birth (yyyy-mm-dd), residential_address,
--   district, participant_status, course_details, institution, occupation, employer,
--   studying_in_madrasa, is_aalim, aadhaar_storage_path, aadhaar_file_name
-- p_consent: { eligibility, accuracy, data_use } all true
--
-- Concurrency: the settings row is locked FOR UPDATE first, so all registrations are
-- serialised. Capacity, duplicate checks and number allocation therefore see a consistent
-- state and two submissions can never both take the last slot.
-- Atomicity: the function runs in one transaction; validation happens before any write and
-- any later error aborts the whole call.
-- ---------------------------------------------------------------------
create function public.register_team(p_submission_id uuid, p_members jsonb, p_consent jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.competition_settings%rowtype;
  m jsonb;
  n integer;
  v_numbers integer[] := '{}';
  v_mobiles text[] := '{}';
  v_mobile text;
  v_dob date;
  v_age integer;
  v_path text;
  v_size bigint;
  v_mime text;
  v_duplicates integer[];
  v_team public.teams%rowtype;
  v_members jsonb := '[]'::jsonb;
  v_uuid constant text := '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
begin
  if p_submission_id is null then
    return private.fail('INVALID_INPUT', '{"field":"submission_id"}');
  end if;

  select * into s from public.competition_settings where id = 1 for update;
  if not found then
    raise exception 'competition_settings row missing';
  end if;

  -- Idempotent retry (e.g. the response was lost to a network error): return the same result.
  select * into v_team from public.teams where submission_id = p_submission_id;
  if found then
    return jsonb_build_object(
      'ok', true,
      'registration_number', v_team.registration_number,
      'submitted_at', v_team.created_at,
      'member_names', (select jsonb_agg(full_name order by member_number)
                       from public.team_members where team_id = v_team.id)
    );
  end if;

  if not s.registration_open then
    return private.fail('REGISTRATION_CLOSED');
  end if;
  if private.occupied_slots() >= s.maximum_teams then
    return private.fail('REGISTRATION_FULL');
  end if;

  if coalesce((p_consent ->> 'eligibility')::boolean, false) is not true
     or coalesce((p_consent ->> 'accuracy')::boolean, false) is not true
     or coalesce((p_consent ->> 'data_use')::boolean, false) is not true then
    return private.fail('INVALID_INPUT', '{"field":"consent"}');
  end if;

  if jsonb_typeof(p_members) is distinct from 'array' or jsonb_array_length(p_members) <> 3 then
    return private.fail('INVALID_TEAM_SIZE');
  end if;

  -- ---- Validate every member before writing anything ----
  for m in select value from jsonb_array_elements(p_members) loop
    if jsonb_typeof(m) <> 'object' or coalesce(m ->> 'member_number', '') !~ '^[1-3]$' then
      return private.fail('INVALID_TEAM_SIZE');
    end if;
    n := (m ->> 'member_number')::integer;
    if n = any (v_numbers) then
      return private.fail('INVALID_TEAM_SIZE');
    end if;
    v_numbers := v_numbers || n;

    -- Required text fields
    if char_length(btrim(coalesce(m ->> 'full_name', ''))) not between 3 and 80
       or btrim(m ->> 'full_name') !~ '^[[:alpha:] .''-]+$' then
      return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'full_name'));
    end if;
    if char_length(btrim(coalesce(m ->> 'residential_address', ''))) not between 10 and 300 then
      return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'residential_address'));
    end if;

    -- Mobile
    v_mobile := private.normalize_mobile(m ->> 'mobile_number');
    if v_mobile !~ '^[6-9][0-9]{9}$' then
      return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'mobile_number'));
    end if;
    if v_mobile = any (v_mobiles) then
      return private.fail('DUPLICATE_PARTICIPANT',
        jsonb_build_object('member_numbers', jsonb_build_array(n), 'scope', 'team'));
    end if;
    v_mobiles := v_mobiles || v_mobile;

    -- Age on competition day (completed years, same semantics as src/domain/age.ts)
    if coalesce(m ->> 'date_of_birth', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'date_of_birth'));
    end if;
    begin
      v_dob := (m ->> 'date_of_birth')::date;
    exception when others then
      return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'date_of_birth'));
    end;
    v_age := extract(year from age(s.competition_date, v_dob))::integer;
    if v_age not between s.min_age and s.max_age then
      return private.fail('INVALID_ELIGIBILITY', jsonb_build_object('member_number', n, 'field', 'date_of_birth'));
    end if;

    if coalesce(m ->> 'district', '') not in ('Dakshina Kannada', 'Udupi') then
      return private.fail('INVALID_ELIGIBILITY', jsonb_build_object('member_number', n, 'field', 'district'));
    end if;

    if jsonb_typeof(m -> 'studying_in_madrasa') <> 'boolean' or jsonb_typeof(m -> 'is_aalim') <> 'boolean' then
      return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'eligibility'));
    end if;
    if (m ->> 'studying_in_madrasa')::boolean then
      return private.fail('INVALID_ELIGIBILITY', jsonb_build_object('member_number', n, 'field', 'studying_in_madrasa'));
    end if;
    if (m ->> 'is_aalim')::boolean then
      return private.fail('INVALID_ELIGIBILITY', jsonb_build_object('member_number', n, 'field', 'is_aalim'));
    end if;

    -- Student / working details
    if m ->> 'participant_status' = 'student' then
      if nullif(btrim(coalesce(m ->> 'course_details', '')), '') is null
         or nullif(btrim(coalesce(m ->> 'institution', '')), '') is null
         or char_length(m ->> 'course_details') > 120 or char_length(m ->> 'institution') > 120 then
        return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'participant_status'));
      end if;
    elsif m ->> 'participant_status' = 'working' then
      if nullif(btrim(coalesce(m ->> 'occupation', '')), '') is null
         or nullif(btrim(coalesce(m ->> 'employer', '')), '') is null
         or char_length(m ->> 'occupation') > 120 or char_length(m ->> 'employer') > 120 then
        return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'participant_status'));
      end if;
    else
      return private.fail('INVALID_INPUT', jsonb_build_object('member_number', n, 'field', 'participant_status'));
    end if;

    -- Aadhaar: must be a file uploaded for this submission and this member, within limits.
    v_path := coalesce(m ->> 'aadhaar_storage_path', '');
    if v_path !~ ('^submissions/' || p_submission_id::text || '/member-' || n || '/' || v_uuid || '\.(jpg|png|pdf)$')
       or char_length(btrim(coalesce(m ->> 'aadhaar_file_name', ''))) not between 1 and 255 then
      return private.fail('INVALID_DOCUMENT', jsonb_build_object('member_number', n));
    end if;
    select (o.metadata ->> 'size')::bigint, o.metadata ->> 'mimetype'
      into v_size, v_mime
      from storage.objects o
      where o.bucket_id = 'aadhaar-documents' and o.name = v_path;
    if not found or v_size is null or v_size not between 1 and 2097152
       or v_mime not in ('image/jpeg', 'image/png', 'application/pdf') then
      return private.fail('INVALID_DOCUMENT', jsonb_build_object('member_number', n));
    end if;
    if exists (select 1 from public.team_members where aadhaar_storage_path = v_path) then
      return private.fail('INVALID_DOCUMENT', jsonb_build_object('member_number', n));
    end if;
  end loop;

  -- ---- Duplicate participants across teams that hold a slot ----
  -- Hard rule for now: same normalised mobile number. Name + date of birth is deliberately
  -- NOT a hard rule (different people can share both). Change the policy here only.
  select array_agg(x.ord::integer order by x.ord)
    into v_duplicates
    from unnest(v_mobiles) with ordinality as x (mobile, ord)
    where exists (
      select 1
      from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where tm.mobile_number = x.mobile and private.team_occupies_slot(t.status)
    );
  if v_duplicates is not null then
    -- v_mobiles was built in array order; map positions back to member numbers.
    select array_agg(v_numbers[d] order by v_numbers[d]) into v_duplicates from unnest(v_duplicates) as d;
    return private.fail('DUPLICATE_PARTICIPANT',
      jsonb_build_object('member_numbers', to_jsonb(v_duplicates), 'scope', 'registered'));
  end if;

  -- ---- Write: team, registration number, three members ----
  update public.competition_settings
    set next_registration_seq = next_registration_seq + 1
    where id = 1;

  insert into public.teams (registration_number, submission_id, consented_at)
  values ('MWA-' || lpad(s.next_registration_seq::text, 3, '0'), p_submission_id, now())
  returning * into v_team;

  insert into public.team_members (
    team_id, member_number, full_name, mobile_number, date_of_birth, residential_address, district,
    participant_status, course_details, institution, occupation, employer,
    studying_in_madrasa, is_aalim,
    aadhaar_storage_path, aadhaar_file_name, aadhaar_size_bytes, aadhaar_mime_type
  )
  select
    v_team.id,
    (x ->> 'member_number')::smallint,
    btrim(x ->> 'full_name'),
    private.normalize_mobile(x ->> 'mobile_number'),
    (x ->> 'date_of_birth')::date,
    btrim(x ->> 'residential_address'),
    x ->> 'district',
    (x ->> 'participant_status')::public.participant_status,
    case when x ->> 'participant_status' = 'student' then btrim(x ->> 'course_details') end,
    case when x ->> 'participant_status' = 'student' then btrim(x ->> 'institution') end,
    case when x ->> 'participant_status' = 'working' then btrim(x ->> 'occupation') end,
    case when x ->> 'participant_status' = 'working' then btrim(x ->> 'employer') end,
    false,
    false,
    x ->> 'aadhaar_storage_path',
    left(btrim(x ->> 'aadhaar_file_name'), 255),
    (o.metadata ->> 'size')::integer,
    o.metadata ->> 'mimetype'
  from jsonb_array_elements(p_members) as x
  join storage.objects o on o.bucket_id = 'aadhaar-documents' and o.name = x ->> 'aadhaar_storage_path';

  select jsonb_agg(full_name order by member_number) into v_members
    from public.team_members where team_id = v_team.id;

  return jsonb_build_object(
    'ok', true,
    'registration_number', v_team.registration_number,
    'submitted_at', v_team.created_at,
    'member_names', v_members
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Admin: dashboard counts (invoker; RLS limits reads to admins).
-- ---------------------------------------------------------------------
create function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_max integer;
  v_occupied integer;
begin
  if not private.is_admin() then
    return private.fail('FORBIDDEN');
  end if;
  select maximum_teams into v_max from public.competition_settings where id = 1;
  v_occupied := private.occupied_slots();
  return jsonb_build_object(
    'ok', true,
    'registered_teams', v_occupied,
    'maximum_teams', v_max,
    'participants', v_occupied * 3,
    'slots_remaining', greatest(v_max - v_occupied, 0),
    'pending_verification', (select count(*) from public.teams where status = 'submitted')
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Admin: change a team's status. SECURITY DEFINER so status changes can only happen here
-- (no direct UPDATE grant on teams): reinstating a team re-checks capacity under the same
-- lock used by register_team().
-- ---------------------------------------------------------------------
create function public.admin_set_team_status(
  p_team_id uuid,
  p_status public.registration_status,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.competition_settings%rowtype;
  v_current public.registration_status;
begin
  if not private.is_admin() then
    return private.fail('FORBIDDEN');
  end if;

  select * into s from public.competition_settings where id = 1 for update;
  select status into v_current from public.teams where id = p_team_id for update;
  if not found then
    return private.fail('NOT_FOUND');
  end if;

  if private.team_occupies_slot(p_status)
     and not private.team_occupies_slot(v_current)
     and private.occupied_slots() >= s.maximum_teams then
    return private.fail('REGISTRATION_FULL');
  end if;

  update public.teams
    set status = p_status,
        admin_note = case when p_status = 'rejected' then nullif(btrim(left(p_note, 500)), '') end
    where id = p_team_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Admin: permanently delete a team (test clean-up / removing an erroneous entry).
-- Returns the Aadhaar storage paths so the caller can remove the files via the Storage API.
-- Not exposed in the UI.
-- ---------------------------------------------------------------------
create function public.admin_delete_team(p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_paths jsonb;
begin
  if not private.is_admin() then
    return private.fail('FORBIDDEN');
  end if;
  select coalesce(jsonb_agg(aadhaar_storage_path), '[]'::jsonb) into v_paths
    from public.team_members where team_id = p_team_id;
  delete from public.teams where id = p_team_id;
  if not found then
    return private.fail('NOT_FOUND');
  end if;
  return jsonb_build_object('ok', true, 'storage_paths', v_paths);
end;
$$;

-- ---------------------------------------------------------------------
-- Admin: uploads never attached to a registration (abandoned forms, replaced files).
-- The caller deletes them through the Storage API (admin DELETE policy).
-- ---------------------------------------------------------------------
create function public.admin_list_orphan_uploads(p_older_than interval default interval '24 hours')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    return private.fail('FORBIDDEN');
  end if;
  return jsonb_build_object('ok', true, 'paths', coalesce((
    select jsonb_agg(o.name order by o.created_at)
    from storage.objects o
    where o.bucket_id = 'aadhaar-documents'
      and o.created_at < now() - p_older_than
      and not exists (select 1 from public.team_members tm where tm.aadhaar_storage_path = o.name)
  ), '[]'::jsonb));
end;
$$;
