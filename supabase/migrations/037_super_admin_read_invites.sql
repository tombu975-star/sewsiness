-- ============================================================
-- 037_super_admin_read_invites.sql
--
-- Lets Super Admin see invite status (pending / accepted / expiry) and
-- use the Resend action from the platform-wide Users & Roles page (see
-- src/app/(app)/admin/users/page.tsx), the same way an Owner/Manager
-- already can from their own Staff/Freelancers/Apprentices pages.
--
-- 032 only granted SELECT to the invited org's own Owner/Manager and to
-- the invitee themselves — Super Admin had no policy at all, so a
-- cross-tenant read (same pattern as "super admin can read all
-- profiles" in 003) just returned nothing rather than erroring.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

drop policy if exists "super admin can read all invites" on invites;
create policy "super admin can read all invites" on invites
  for select using (current_role_name() = 'super_admin');
