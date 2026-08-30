-- ============================================================
-- 009_system_admin.sql
--
-- Adds a second platform-level role, distinct from Super Admin:
--
--   super_admin  — Sewsiness's business-operations account. Enrolls
--                   businesses, manages users/roles, sees operational
--                   health signals. Never sees revenue/customer data.
--   system_admin — Sewsiness's own developer/technical account. Decides
--                   which parts of the system are live (feature flags),
--                   tracks third-party API health (integrations), and
--                   logs/fixes issues before a business ever sees them
--                   (incidents). Never sees ANY business or customer
--                   data, and never sees the Users & Roles / Enrolled
--                   Businesses screens either — it has no reason to,
--                   and keeping it out is the same "least privilege"
--                   principle super_admin already follows.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

-- 1. Extend the role enum (a plain text CHECK, not a real Postgres
--    enum type — see schema.sql) to allow 'system_admin'.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('super_admin','system_admin','owner','manager','staff','apprentice','freelancer','trainer'));

-- role_permissions (006_rbac_console.sql) has its own copy of the same
-- enum for the governance matrix — keep it in sync.
alter table role_permissions drop constraint if exists role_permissions_role_check;
alter table role_permissions add constraint role_permissions_role_check
  check (role in ('super_admin','system_admin','owner','manager','staff','apprentice','freelancer','trainer'));

insert into role_permissions (role, module, action, scope, allowed)
values
  ('system_admin', 'Feature Flags', 'MANAGE', 'PLATFORM', true),
  ('system_admin', 'Integrations', 'MANAGE', 'PLATFORM', true),
  ('system_admin', 'System Health', 'VIEW', 'PLATFORM', true),
  ('system_admin', 'Incidents', 'MANAGE', 'PLATFORM', true)
on conflict (role, module, action) do nothing;

-- profiles.organization_id is already nullable (see 002_platform_admin.sql,
-- step 1) — system_admin is organization-less the same way super_admin is.
-- "users can read own profile" (id = auth.uid()) already covers it too.

-- ------------------------------------------------------------
-- 2. Feature flags — "which part of the system is live".
--    Readable by any signed-in user (so pages can gate themselves on
--    the server: see src/lib/feature-flags.ts), writable only by
--    System Admin.
-- ------------------------------------------------------------

create table if not exists feature_flags (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  label text not null,
  description text,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

alter table feature_flags enable row level security;

drop policy if exists "authenticated can read feature flags" on feature_flags;
create policy "authenticated can read feature flags" on feature_flags
  for select using (auth.role() = 'authenticated');

drop policy if exists "system admin manages feature flags" on feature_flags;
create policy "system admin manages feature flags" on feature_flags
  for all
  using (current_role_name() = 'system_admin')
  with check (current_role_name() = 'system_admin');

-- ------------------------------------------------------------
-- 3. Integration health registry — "configure/monitor third-party
--    APIs". Deliberately holds NO secret values: only which provider,
--    which env vars Render needs for it, and the last time System
--    Admin checked whether those env vars are actually set. Real
--    credentials stay in Render's environment settings, never in the
--    database. System Admin only.
-- ------------------------------------------------------------

create table if not exists integration_checks (
  id uuid primary key default uuid_generate_v4(),
  provider_key text not null unique,
  provider_name text not null,
  category text not null default 'Other',
  docs_url text,
  required_env_vars text[] not null default '{}',
  status text not null default 'unknown' check (status in ('connected', 'not_configured', 'error', 'unknown')),
  last_checked_at timestamptz,
  last_message text,
  created_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

alter table integration_checks enable row level security;

drop policy if exists "system admin manages integrations" on integration_checks;
create policy "system admin manages integrations" on integration_checks
  for all
  using (current_role_name() = 'system_admin')
  with check (current_role_name() = 'system_admin');

-- Seed the providers relevant to Sewsiness today (Supabase) and the
-- likely near-term additions (payments/messaging) — edit or add rows
-- from the Integrations screen as real providers get wired in.
insert into integration_checks (provider_key, provider_name, category, docs_url, required_env_vars)
values
  ('supabase', 'Supabase', 'Core', 'https://supabase.com/dashboard/project/_/settings/api', array['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']),
  ('paystack', 'Paystack', 'Payments', 'https://dashboard.paystack.com/#/settings/developer', array['PAYSTACK_SECRET_KEY']),
  ('resend', 'Resend (email)', 'Messaging', 'https://resend.com/api-keys', array['RESEND_API_KEY']),
  ('whatsapp', 'WhatsApp Cloud API', 'Messaging', 'https://developers.facebook.com/apps', array['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'])
on conflict (provider_key) do nothing;

-- ------------------------------------------------------------
-- 4. Incidents — "fix issues before users see them". A lightweight
--    log System Admin can use to track something broken/degraded from
--    the moment it's noticed through to resolution. System Admin only.
-- ------------------------------------------------------------

create table if not exists system_incidents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  area text,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  resolved_by uuid references profiles(id) on delete set null
);

alter table system_incidents enable row level security;

drop policy if exists "system admin manages incidents" on system_incidents;
create policy "system admin manages incidents" on system_incidents
  for all
  using (current_role_name() = 'system_admin')
  with check (current_role_name() = 'system_admin');
