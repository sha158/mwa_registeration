-- =====================================================================
-- Advisor follow-up: admin_list_orphan_uploads does not need SECURITY DEFINER.
-- Admins already read storage.objects and team_members through RLS policies, so run it with
-- the caller's privileges (least privilege). The explicit is_admin() check stays.
-- =====================================================================
alter function public.admin_list_orphan_uploads(interval) security invoker;
