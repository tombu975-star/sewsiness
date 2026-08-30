-- ============================================================
-- 008_security_hardening.sql
--
-- CRITICAL FIX — profile privilege escalation.
--
-- "users can update own profile" (schema.sql) is `for update using
-- (id = auth.uid())` with no column-level restriction. Postgres RLS
-- only gates *which rows* a policy applies to, not *which columns*
-- change within an allowed row — so today, any authenticated user can
-- run this directly from the browser with nothing more than the
-- public anon key:
--
--   supabase.from('profiles').update({
--     role: 'super_admin',
--     organization_id: '<any other business>',
--     suspended_at: null,
--   }).eq('id', myOwnId)
--
-- ...and it succeeds, because `id = auth.uid()` is satisfied. That's a
-- full account takeover / cross-tenant breach available to literally
-- any signed-in user (down to the lowest-privilege apprentice or
-- freelancer account), independent of anything the Next.js app does.
--
-- Column-level RLS isn't a first-class feature, so this is enforced
-- with a BEFORE UPDATE trigger instead: self-service profile edits
-- may never touch role, organization_id, branch_id, or suspended_at
-- unless the *acting* user (auth.uid(), resolved through
-- current_role_name(), NOT the row being written) is already
-- super_admin.
--
-- The existing Super Admin flows (suspendUser/reactivateUser,
-- verifyFreelancer, enrollBusiness, etc.) go through the service-role
-- admin client in src/lib/supabase/admin.ts, which connects as
-- Postgres role `service_role` and bypasses RLS entirely — but
-- triggers still fire regardless of RLS, so this trigger explicitly
-- lets that trusted server-side path through via auth.role().
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create or replace function prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The service-role admin client (server actions already gated by
  -- requireSuperAdmin() in application code, e.g. suspendUser,
  -- verifyFreelancer, enrollBusiness) carries no user JWT to evaluate
  -- against current_role_name() — let it through, it's already the
  -- trusted, privileged path.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.organization_id is distinct from old.organization_id
     or new.branch_id is distinct from old.branch_id
     or new.suspended_at is distinct from old.suspended_at
  then
    if coalesce(current_role_name(), '') <> 'super_admin' then
      raise exception 'You are not allowed to change role, organization, branch, or suspension status on this profile.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_privilege_escalation on profiles;
create trigger trg_prevent_profile_privilege_escalation
  before update on profiles
  for each row
  execute function prevent_profile_privilege_escalation();

-- ------------------------------------------------------------
-- HIGH — organizations had a read policy but no UPDATE policy at all,
-- so settings/actions.ts's updateOrganization() has been silently
-- affecting zero rows for every Owner who has ever tried to rename
-- their business or set a brand color (same failure shape as the
-- earlier zero-row profiles UPDATE bug — RLS default-denies with no
-- error, the app just doesn't persist anything).
-- ------------------------------------------------------------

drop policy if exists "owner can update own organization" on organizations;
create policy "owner can update own organization" on organizations
  for update
  using (id = current_org_id() and current_role_name() = 'owner')
  with check (id = current_org_id() and current_role_name() = 'owner');
