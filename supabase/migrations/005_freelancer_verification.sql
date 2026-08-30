-- ============================================================
-- 005_freelancer_verification.sql
-- Adds real backing for the "Verify freelancers" action in the new
-- platform-level Freelancer Network console. Additive and safe to run
-- against the live database as-is.
-- ============================================================

alter table freelancer_profiles add column if not exists verified_at timestamptz;

drop policy if exists "super admin can verify freelancers" on freelancer_profiles;
create policy "super admin can verify freelancers" on freelancer_profiles
  for update using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');
