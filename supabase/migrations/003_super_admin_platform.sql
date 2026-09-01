-- ============================================================
-- 003_super_admin_platform.sql
-- Phase 2 of the Super Admin platform layer: real audit logging,
-- a global Users & Roles directory, and account suspension.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

-- 1. Audit log — was referenced by src/app/(app)/audit/page.tsx but the
--    table never actually existed, so that page has been erroring for
--    every Owner who opens it. This creates it for real and gives
--    Super Admin a platform-wide read policy on top of the existing
--    per-business one.
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;

drop policy if exists "org members can read own org audit logs" on audit_logs;
create policy "org members can read own org audit logs" on audit_logs
  for select using (organization_id = current_org_id());

drop policy if exists "super admin can read all audit logs" on audit_logs;
create policy "super admin can read all audit logs" on audit_logs
  for select using (current_role_name() = 'super_admin');

-- 2. Let Super Admin see the platform-wide Users & Roles directory.
--    (Organizations were already opened up to Super Admin in migration
--    002; profiles were not.)
drop policy if exists "super admin can read all profiles" on profiles;
create policy "super admin can read all profiles" on profiles
  for select using (current_role_name() = 'super_admin');

-- 3. Account suspension. A suspended user keeps their row (so nothing
--    they created is orphaned) but is signed out on next check and
--    blocked from signing back in until Super Admin reactivates them.
alter table profiles add column if not exists suspended_at timestamptz;

drop policy if exists "super admin can suspend or reactivate profiles" on profiles;
create policy "super admin can suspend or reactivate profiles" on profiles
  for update using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');
