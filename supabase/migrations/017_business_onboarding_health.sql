-- ============================================================
-- 017_business_onboarding_health.sql
--
-- Aligns Sewiness with the "Fashion Business Onboarding & Health"
-- module: a light identity/compliance profile captured at signup, plus
-- a fuller, in-app, self-reported Business Health Assessment (Operations,
-- Sales & Marketing, Finance, Human Capital, Apprentices, Freelancers,
-- Digital Maturity, ESG) that produces a weighted 0-100 score and
-- recommendations for the business owner — separate from (and
-- complementary to) the existing get_business_directory() operational
-- health_score, which stays Super-Admin-only and transaction-derived.
--
-- International-standards notes:
--   - legal_entity_type uses Ghana's Registrar-General's Department
--     categories (closest local equivalent of ISO 20275 "Entity Legal
--     Form" — swap in the full ELF code list if/when multi-country).
--   - tax_id stores Ghana Revenue Authority TIN format (GHA-XXXXXXXXX,
--     11 alphanumeric per GRA spec) — validated in app code, not here.
--   - contact_country is ISO 3166-1 alpha-2 (ISO country codes), so the
--     column travels cleanly if Sewiness ever expands beyond Ghana.
--   - currency amounts everywhere in this schema remain GHS (ISO 4217)
--     per the existing `numeric(12,2)` convention used across the app.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Light identity & compliance fields on organizations
--    (collected once, at signup — see src/app/signup/actions.ts)
-- ------------------------------------------------------------

alter table organizations add column if not exists legal_entity_type text
  check (legal_entity_type in (
    'Sole Proprietorship', 'Partnership', 'Limited Liability Company',
    'Registered Cooperative', 'Informal / Unregistered'
  ));
alter table organizations add column if not exists registration_number text;
alter table organizations add column if not exists tax_id text;
alter table organizations add column if not exists business_categories jsonb not null default '[]'::jsonb;
alter table organizations add column if not exists business_age_years numeric;
alter table organizations add column if not exists contact_phone text;
alter table organizations add column if not exists contact_country text not null default 'GH';

comment on column organizations.contact_country is 'ISO 3166-1 alpha-2 country code.';
comment on column organizations.business_categories is 'Array of strings, e.g. ["Bespoke Tailoring","Fabric Retail"].';

-- ------------------------------------------------------------
-- 2. Full self-reported Business Health Assessment
-- ------------------------------------------------------------

create table if not exists onboarding_assessments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'archived')),
  answers jsonb not null default '{}'::jsonb,
  dimension_scores jsonb not null default '{}'::jsonb,
  overall_score integer,
  health_band text,
  recommendations jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  submitted_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_onboarding_assessments_org on onboarding_assessments(organization_id);

-- Only one active draft per business at a time — new sessions resume the
-- existing draft rather than piling up duplicates. Submitted assessments
-- are versioned (see `version`) and left alone so history is preserved.
create unique index if not exists idx_onboarding_assessments_one_draft
  on onboarding_assessments(organization_id)
  where (status = 'draft');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_onboarding_assessments_updated_at on onboarding_assessments;
create trigger trg_onboarding_assessments_updated_at
  before update on onboarding_assessments
  for each row execute function set_updated_at();

alter table onboarding_assessments enable row level security;

drop policy if exists "org members can read own assessments" on onboarding_assessments;
create policy "org members can read own assessments" on onboarding_assessments
  for select using (organization_id = current_org_id());

-- Owner/Manager are the roles trusted to speak for the business's
-- operational and financial posture — same trust boundary as `costing`
-- and `payments` writes elsewhere in this schema.
drop policy if exists "owner+manager can write assessments" on onboarding_assessments;
create policy "owner+manager can write assessments" on onboarding_assessments
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager')
  );

drop policy if exists "owner+manager can update assessments" on onboarding_assessments;
create policy "owner+manager can update assessments" on onboarding_assessments
  for update using (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager')
  );

-- Super Admin sees assessment *status and score only* in the UI layer
-- (src/app/(app)/admin/[id]/page.tsx) even though this policy grants
-- row-level read — consistent with the "operational signals, never raw
-- business detail" boundary already established for get_business_directory().
drop policy if exists "super admin can read all assessments" on onboarding_assessments;
create policy "super admin can read all assessments" on onboarding_assessments
  for select using (current_role_name() = 'super_admin');
