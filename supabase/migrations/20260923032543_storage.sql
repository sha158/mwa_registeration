-- =====================================================================
-- MWA Quiz Registration — private Aadhaar storage
--
-- Bucket is private: no public URLs. Admins view files through short-lived signed URLs.
--
-- Path layout (no names, numbers or original filenames in paths):
--   submissions/<submission_id>/member-<1|2|3>/<random uuid>.<jpg|png|pdf>
--
-- Upload → register strategy: files are uploaded while the form is filled in, under the
-- draft's submission id. register_team() verifies each referenced object (path, size, type)
-- and stores only its path. Files never referenced by a team (abandoned forms, replaced
-- uploads) are listed by admin_list_orphan_uploads() and removed by an admin.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aadhaar-documents', 'aadhaar-documents', false, 2097152,
        array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Participants (anonymous) may create new objects, only at well-formed submission paths.
-- No SELECT/UPDATE/DELETE for them: they cannot list, read, overwrite or remove files.
create policy "Registrants upload Aadhaar to submission paths" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'aadhaar-documents'
    and name ~ '^submissions/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/member-[1-3]/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|pdf)$'
  );

-- Admins read (required for signed URLs) and delete (orphan clean-up).
create policy "Admins read Aadhaar documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'aadhaar-documents' and (select private.is_admin()));

create policy "Admins delete Aadhaar documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'aadhaar-documents' and (select private.is_admin()));
