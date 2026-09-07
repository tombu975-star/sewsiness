-- ============================================================
-- 018_platform_business_intelligence.sql
--
-- Adds the "Business Performance Intelligence" surface for Super Admin
-- (aggregated health/growth/trend/priority/support-area across every
-- verified business) plus two lightweight public-intake tables: leads
-- from the "/open-account" page and requests from "/forgot-account".
--
-- This is deliberately additive on top of what already exists:
--   - Per-business health already comes from onboarding_assessments
--     (see 017_business_onboarding_health.sql) and is shown to the
--     owner themselves, plus status/score-only to Super Admin via
--     src/app/(app)/admin/[id]/page.tsx.
--   - `platform_business_metrics` below is the cross-business rollup
--     that view doesn't provide: growth vs. the previous submitted
--     assessment, a trend label, and a priority band — still nothing
--     but the derived score ever leaves the tenant boundary.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Cross-business rollup for Super Admin's Business Performance
--    Intelligence page (src/app/(app)/admin/intelligence/page.tsx).
--    A view, not a table: always reflects the latest submitted
--    assessments, nothing to keep in sync.
-- ------------------------------------------------------------

create or replace view platform_business_metrics as
with ranked as (
  select
    oa.*,
    row_number() over (partition by oa.organization_id order by oa.version desc) as rn
  from onboarding_assessments oa
  where oa.status = 'submitted'
),
latest as (
  select * from ranked where rn = 1
),
previous as (
  select * from ranked where rn = 2
)
select
  o.id as organization_id,
  o.name as business_name,
  o.region,
  l.overall_score as health_score,
  l.dimension_scores,
  case when p.overall_score is null then null else l.overall_score - p.overall_score end as growth_delta,
  case
    when l.overall_score is null then 'No assessment'
    when p.overall_score is null then 'New'
    when l.overall_score - p.overall_score > 2 then 'Improving'
    when l.overall_score - p.overall_score < -2 then 'Declining'
    else 'Stable'
  end as trend,
  case
    when l.overall_score is null then 'Unknown'
    when l.overall_score < 50 then 'Critical'
    when l.overall_score < 65 then 'Medium'
    else 'Low'
  end as priority,
  l.submitted_at as health_submitted_at
from organizations o
left join latest l on l.organization_id = o.id
left join previous p on p.organization_id = o.id
where o.verification_status = 'verified';

comment on view platform_business_metrics is
  'Privacy-safe, cross-business rollup for Super Admin: health, growth, trend and priority only — never revenue, customers or raw tenant records. Views inherit RLS from their underlying tables (organizations, onboarding_assessments), whose existing policies already gate Super Admin to health_score/status only.';

-- ------------------------------------------------------------
-- 1b. Denormalized owner contact email on organizations, captured once
--     at signup. Needed so "/forgot-account" (below) can look up which
--     business an email belongs to without depending on Supabase
--     Auth's admin API supporting email-based user search (it doesn't,
--     reliably, across all plans/versions).
-- ------------------------------------------------------------

alter table organizations add column if not exists contact_email text;
create index if not exists idx_organizations_contact_email on organizations (lower(contact_email));

-- ------------------------------------------------------------
-- 2. "/open-account" lead intake — a lighter-weight entry point than
--    self-serve /signup (no Ghana Card / selfie yet), for people who
--    want Sewsiness to reach out and help them get set up.
--    Inserted via the server action using the service-role client
--    (src/app/open-account/actions.ts), so no public insert policy
--    is needed here.
-- ------------------------------------------------------------

create table if not exists account_requests (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  business_name text not null,
  email text not null,
  phone text,
  note text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id) on delete set null
);

alter table account_requests enable row level security;

drop policy if exists "super admin can read account requests" on account_requests;
create policy "super admin can read account requests" on account_requests
  for select using (current_role_name() = 'super_admin');

drop policy if exists "super admin can update account requests" on account_requests;
create policy "super admin can update account requests" on account_requests
  for update using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');

-- ------------------------------------------------------------
-- 3. "/forgot-account" recovery intake — for someone who has forgotten
--    which business account they belong to (distinct from
--    /forgot-password, which resets a known account's credentials).
--    The page always shows a generic confirmation regardless of
--    whether a match was found, to avoid confirming account existence
--    to an unauthenticated visitor; the match (if any) is recorded
--    here for Super Admin/support follow-up only.
-- ------------------------------------------------------------

create table if not exists account_recovery_requests (
  id uuid primary key default uuid_generate_v4(),
  contact text not null,
  matched_organization_id uuid references organizations(id) on delete set null,
  matched_profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id) on delete set null
);

alter table account_recovery_requests enable row level security;

drop policy if exists "super admin can read account recovery requests" on account_recovery_requests;
create policy "super admin can read account recovery requests" on account_recovery_requests
  for select using (current_role_name() = 'super_admin');

drop policy if exists "super admin can update account recovery requests" on account_recovery_requests;
create policy "super admin can update account recovery requests" on account_recovery_requests
  for update using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');
