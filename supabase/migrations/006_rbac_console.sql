-- ============================================================
-- 006_rbac_console.sql
-- Adds a real, editable permission-matrix table backing the new
-- "Roles & Permissions" console.
--
-- IMPORTANT — READ BEFORE TREATING THIS AS LIVE ENFORCEMENT:
-- Every existing access rule in this app (RLS policies using
-- current_role_name(), the SIDEBAR role arrays in src/lib/nav.ts, the
-- middleware guard around Super Admin) is hand-written directly against
-- the fixed role enum on `profiles`. This table does NOT replace any of
-- that. It's a governance record of what each role is *intended* to be
-- able to do — genuinely stored, genuinely editable by Super Admin — but
-- toggling a checkbox here will not, by itself, change what anyone can
-- actually do in the app yet. Wiring real enforcement to read from this
-- table instead of hardcoded checks is a much larger, separate migration
-- (touching every RLS policy in schema.sql) that should be done
-- deliberately, one policy at a time, and tested — not silently bundled
-- in here. The console UI says this too, in plain language.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists role_permissions (
  id uuid primary key default uuid_generate_v4(),
  role text not null check (role in ('super_admin','owner','manager','staff','apprentice','freelancer','trainer')),
  module text not null,
  action text not null check (action in ('VIEW','CREATE','EDIT','DELETE','APPROVE','EXPORT','MANAGE','ADMINISTER')),
  scope text not null check (scope in ('PLATFORM','BUSINESS','TEAM','PERSONAL','TASK')),
  allowed boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null,
  unique (role, module, action)
);

alter table role_permissions enable row level security;

drop policy if exists "super admin manages role permissions" on role_permissions;
create policy "super admin manages role permissions" on role_permissions
  for all
  using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');

-- Seed a representative matrix reflecting how the app actually behaves
-- today (see src/lib/nav.ts and schema.sql's RLS policies). Not
-- exhaustive — it covers the modules named in the Super Admin spec's own
-- example matrix, plus the handful of business modules already
-- role-gated in nav.ts, as a realistic starting reference.
insert into role_permissions (role, module, action, scope, allowed)
values
  -- Super Admin: platform-level, per the existing boundary in this app.
  ('super_admin', 'Businesses', 'VIEW', 'PLATFORM', true),
  ('super_admin', 'Businesses', 'CREATE', 'PLATFORM', true),
  ('super_admin', 'Businesses', 'EDIT', 'PLATFORM', true),
  ('super_admin', 'Businesses', 'DELETE', 'PLATFORM', false),
  ('super_admin', 'Businesses', 'APPROVE', 'PLATFORM', true),
  ('super_admin', 'Businesses', 'EXPORT', 'PLATFORM', false),
  ('super_admin', 'Users', 'VIEW', 'PLATFORM', true),
  ('super_admin', 'Users', 'EDIT', 'PLATFORM', true),
  ('super_admin', 'Users', 'DELETE', 'PLATFORM', false),
  ('super_admin', 'Users', 'MANAGE', 'PLATFORM', true),
  ('super_admin', 'Analytics', 'VIEW', 'PLATFORM', true),
  ('super_admin', 'Analytics', 'EXPORT', 'PLATFORM', false),
  ('super_admin', 'System Settings', 'VIEW', 'PLATFORM', true),
  ('super_admin', 'System Settings', 'ADMINISTER', 'PLATFORM', true),
  ('super_admin', 'Audit Logs', 'VIEW', 'PLATFORM', true),
  ('super_admin', 'Audit Logs', 'EXPORT', 'PLATFORM', false),

  -- Owner: full run of their own business.
  ('owner', 'Customers', 'VIEW', 'BUSINESS', true),
  ('owner', 'Customers', 'EDIT', 'BUSINESS', true),
  ('owner', 'Customers', 'DELETE', 'BUSINESS', true),
  ('owner', 'Payments', 'VIEW', 'BUSINESS', true),
  ('owner', 'Payments', 'MANAGE', 'BUSINESS', true),
  ('owner', 'Staff', 'MANAGE', 'BUSINESS', true),
  ('owner', 'Audit Logs', 'VIEW', 'BUSINESS', true),

  -- Manager: most business operations, not staff/financial administration.
  ('manager', 'Customers', 'VIEW', 'BUSINESS', true),
  ('manager', 'Customers', 'EDIT', 'BUSINESS', true),
  ('manager', 'Customers', 'DELETE', 'BUSINESS', false),
  ('manager', 'Payments', 'VIEW', 'BUSINESS', true),
  ('manager', 'Payments', 'MANAGE', 'BUSINESS', false),
  ('manager', 'Staff', 'MANAGE', 'BUSINESS', false),

  -- Staff: day-to-day task scope only.
  ('staff', 'Customers', 'VIEW', 'TEAM', true),
  ('staff', 'Customers', 'EDIT', 'TEAM', false),
  ('staff', 'Payments', 'VIEW', 'TEAM', false),

  -- Apprentice / Trainer / Freelancer: personal/task scope only.
  ('apprentice', 'Training Tasks', 'VIEW', 'PERSONAL', true),
  ('trainer', 'Training Tasks', 'VIEW', 'TEAM', true),
  ('trainer', 'Training Tasks', 'MANAGE', 'TEAM', true),
  ('freelancer', 'Work Requests', 'VIEW', 'TASK', true)
on conflict (role, module, action) do nothing;
