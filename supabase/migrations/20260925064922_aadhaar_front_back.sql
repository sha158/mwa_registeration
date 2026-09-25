-- =====================================================================
-- Aadhaar front + back.
--
-- Rule: every member has a FRONT document (the existing aadhaar_* columns). A BACK document
-- (aadhaar_back_*) is required unless the front is a PDF — the official e-Aadhaar PDF already
-- shows both sides. The back carries the address, which organisers need to see.
--
-- Storage path layout is unchanged (both files live under
-- submissions/<submission_id>/member-<n>/<uuid>.<ext>), so storage policies are untouched.
-- =====================================================================

alter table public.team_members
  add column aadhaar_back_storage_path text unique,
  add column aadhaar_back_file_name text
    check (char_length(aadhaar_back_file_name) between 1 and 255),
  add column aadhaar_back_size_bytes integer
    check (aadhaar_back_size_bytes between 1 and 2097152),
  add column aadhaar_back_mime_type text
    check (aadhaar_back_mime_type in ('image/jpeg', 'image/png', 'application/pdf')),
  add constraint team_members_aadhaar_back_all_or_none check (
    num_nulls(aadhaar_back_storage_path, aadhaar_back_file_name, aadhaar_back_size_bytes, aadhaar_back_mime_type) in (0, 4)
  ),
  add constraint team_members_aadhaar_back_required check (
    aadhaar_back_storage_path is not null or aadhaar_mime_type = 'application/pdf'
  ),
  add constraint team_members_aadhaar_back_distinct check (aadhaar_back_storage_path <> aadhaar_storage_path);

-- ---------------------------------------------------------------------
-- One uploaded Aadhaar file, if it is usable for this submission and member: correct path,
-- exists in the private bucket, within size/type limits, and not already attached to any
-- member (as front or back). Returns no row otherwise.
-- Called only from register_team() (which runs as the owner); no grants.
-- ---------------------------------------------------------------------
create function private.aadhaar_object(p_path text, p_submission_id uuid, p_member_number integer)
returns table (size_bytes integer, mime_type text)
language sql
stable
set search_path = ''
as $$
  select (o.metadata ->> 'size')::integer, o.metadata ->> 'mimetype'
  from storage.objects o
  where o.bucket_id = 'aadhaar-documents'
    and o.name = p_path
    and p_path ~ ('^submissions/' || p_submission_id::text || '/member-' || p_member_number
                  || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|pdf)$')
    and (o.metadata ->> 'size')::bigint between 1 and 2097152
    and o.metadata ->> 'mimetype' in ('image/jpeg', 'image/png', 'application/pdf')
    and not exists (select 1 from public.team_members tm where tm.aadhaar_storage_path = p_path)
    and not exists (select 1 from public.team_members tm where tm.aadhaar_back_storage_path = p_path);
$$;

revoke all on function private.aadhaar_object(text, uuid, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- register_team: same rules as before, plus the front/back document rule.
-- Signature unchanged, so existing EXECUTE grants are kept.
-- ---------------------------------------------------------------------
create or replace function public.register_team(p_submission_id uuid, p_members jsonb, p_consent jsonb)
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
  v_mime text;
  v_back_path text;
  v_back_mime text;
  v_duplicates integer[];
  v_team public.teams%rowtype;
  v_members jsonb := '[]'::jsonb;
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

    -- Aadhaar front (or the whole e-Aadhaar PDF): uploaded for this submission and member.
    v_path := coalesce(m ->> 'aadhaar_storage_path', '');
    v_mime := null;
    select o.mime_type into v_mime from private.aadhaar_object(v_path, p_submission_id, n) o;
    if v_mime is null or char_length(btrim(coalesce(m ->> 'aadhaar_file_name', ''))) not between 1 and 255 then
      return private.fail('INVALID_DOCUMENT', jsonb_build_object('member_number', n, 'side', 'front'));
    end if;

    -- Aadhaar back: required unless the front is a PDF.
    v_back_path := nullif(m ->> 'aadhaar_back_storage_path', '');
    if v_back_path is null then
      if v_mime <> 'application/pdf' then
        return private.fail('INVALID_DOCUMENT', jsonb_build_object('member_number', n, 'side', 'back'));
      end if;
    else
      v_back_mime := null;
      select o.mime_type into v_back_mime from private.aadhaar_object(v_back_path, p_submission_id, n) o;
      if v_back_mime is null or v_back_path = v_path
         or char_length(btrim(coalesce(m ->> 'aadhaar_back_file_name', ''))) not between 1 and 255 then
        return private.fail('INVALID_DOCUMENT', jsonb_build_object('member_number', n, 'side', 'back'));
      end if;
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
    aadhaar_storage_path, aadhaar_file_name, aadhaar_size_bytes, aadhaar_mime_type,
    aadhaar_back_storage_path, aadhaar_back_file_name, aadhaar_back_size_bytes, aadhaar_back_mime_type
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
    o.metadata ->> 'mimetype',
    b.name,
    case when b.name is not null then left(btrim(x ->> 'aadhaar_back_file_name'), 255) end,
    (b.metadata ->> 'size')::integer,
    b.metadata ->> 'mimetype'
  from jsonb_array_elements(p_members) as x
  join storage.objects o on o.bucket_id = 'aadhaar-documents' and o.name = x ->> 'aadhaar_storage_path'
  left join storage.objects b
    on b.bucket_id = 'aadhaar-documents' and b.name = nullif(x ->> 'aadhaar_back_storage_path', '');

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
-- admin_delete_team: also return back-side paths so the caller removes every file.
-- ---------------------------------------------------------------------
create or replace function public.admin_delete_team(p_team_id uuid)
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
  select coalesce(jsonb_agg(p.path), '[]'::jsonb) into v_paths
    from public.team_members tm
    cross join lateral unnest(array[tm.aadhaar_storage_path, tm.aadhaar_back_storage_path]) as p (path)
    where tm.team_id = p_team_id and p.path is not null;
  delete from public.teams where id = p_team_id;
  if not found then
    return private.fail('NOT_FOUND');
  end if;
  return jsonb_build_object('ok', true, 'storage_paths', v_paths);
end;
$$;

-- ---------------------------------------------------------------------
-- admin_list_orphan_uploads: a file is an orphan only if no member references it as front
-- or back. Stays SECURITY INVOKER (see 20260923032642_orphan_uploads_invoker.sql).
-- ---------------------------------------------------------------------
create or replace function public.admin_list_orphan_uploads(p_older_than interval default interval '24 hours')
returns jsonb
language plpgsql
stable
security invoker
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
      and not exists (select 1 from public.team_members tm where tm.aadhaar_back_storage_path = o.name)
  ), '[]'::jsonb));
end;
$$;
