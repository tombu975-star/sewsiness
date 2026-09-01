-- ============================================================
-- 009_learning_platform.sql
--
-- Turns the flat apprentice to-do list (training_tasks) into a real
-- learning platform:
--
--   training_programs   — a structured curriculum an org defines
--                          (e.g. "Foundation Tailoring", 12 weeks).
--                          program_type distinguishes an ordinary
--                          workplace apprenticeship from a TVET
--                          program — see the note below.
--   training_modules    — ordered units within a program.
--   program_enrollments — links an apprentice to a program they're
--                          doing. institution_name/institution_student_id
--                          are here (nullable) for the TVET case in the
--                          request: "in the future there will be TVET
--                          students enrolled" — when that happens, an
--                          enrollment is where their institution + student
--                          ID naturally belongs, without another schema
--                          change. A TVET student is still just a
--                          profile with role='apprentice' doing a
--                          program_type='tvet' program; nothing here
--                          requires a new role.
--   training_tasks       — existing table, now doing double duty as
--                          gradable assessments: optionally tied to a
--                          module/enrollment, with a score, feedback,
--                          submitted evidence photo, and who evaluated
--                          it. Ad-hoc tasks (module_id/enrollment_id
--                          null) still work exactly as before — this is
--                          additive, not a breaking change to the
--                          existing Training Plans page.
--   certificates          — issued when a Trainer/Manager/Owner marks an
--                          enrollment complete. Has a public-safe
--                          verification_code (short, unguessable) for
--                          the new /verify/[code] page — third parties
--                          (an employer, a TVET body) can confirm a
--                          certificate is genuine without seeing
--                          anything else about the business.
--
-- Certificate rendering is an HTML page with a print stylesheet
-- (window.print() → PDF), not a stored PDF file — this project has no
-- PDF-generation library yet and no network access in this environment
-- to add one. That's a real, working "download as PDF" experience via
-- the browser's print dialog; swap in a proper PDF library later
-- (e.g. @react-pdf/renderer) without any schema change if a literal
-- stored PDF file becomes worth the dependency.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists training_programs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  program_type text not null default 'workplace' check (program_type in ('workplace', 'tvet')),
  duration_weeks int,
  pass_score numeric not null default 70 check (pass_score >= 0 and pass_score <= 100),
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table training_programs enable row level security;

drop policy if exists "org members can read training programs" on training_programs;
create policy "org members can read training programs" on training_programs
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write training programs" on training_programs;
create policy "org members can write training programs" on training_programs
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update training programs" on training_programs;
create policy "org members can update training programs" on training_programs
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all training programs" on training_programs;
create policy "super admin can read all training programs" on training_programs
  for select using (current_role_name() = 'super_admin');

create table if not exists training_modules (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references training_programs(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  sequence int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_training_modules_program_id on training_modules(program_id);

alter table training_modules enable row level security;

drop policy if exists "org members can read training modules" on training_modules;
create policy "org members can read training modules" on training_modules
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write training modules" on training_modules;
create policy "org members can write training modules" on training_modules
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update training modules" on training_modules;
create policy "org members can update training modules" on training_modules
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all training modules" on training_modules;
create policy "super admin can read all training modules" on training_modules
  for select using (current_role_name() = 'super_admin');

create table if not exists program_enrollments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  program_id uuid not null references training_programs(id) on delete cascade,
  apprentice_id uuid not null references profiles(id) on delete cascade,
  trainer_id uuid references profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'withdrawn')),
  institution_name text,
  institution_student_id text,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  final_score numeric
);

create index if not exists idx_program_enrollments_program_id on program_enrollments(program_id);
create index if not exists idx_program_enrollments_apprentice_id on program_enrollments(apprentice_id);
create index if not exists idx_program_enrollments_trainer_id on program_enrollments(trainer_id);
-- One active enrollment per apprentice per program at a time — re-enrollment
-- after completion/withdrawal is fine, just not two simultaneous actives.
create unique index if not exists uniq_active_enrollment on program_enrollments(program_id, apprentice_id) where status = 'active';

alter table program_enrollments enable row level security;

drop policy if exists "org members can read program enrollments" on program_enrollments;
create policy "org members can read program enrollments" on program_enrollments
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write program enrollments" on program_enrollments;
create policy "org members can write program enrollments" on program_enrollments
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update program enrollments" on program_enrollments;
create policy "org members can update program enrollments" on program_enrollments
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all program enrollments" on program_enrollments;
create policy "super admin can read all program enrollments" on program_enrollments
  for select using (current_role_name() = 'super_admin');

-- training_tasks becomes gradable: optional module/enrollment link, score,
-- feedback, submitted evidence, and who evaluated it. All nullable — the
-- existing ad-hoc "assign a quick task" flow is untouched.
alter table training_tasks add column if not exists module_id uuid references training_modules(id) on delete set null;
alter table training_tasks add column if not exists enrollment_id uuid references program_enrollments(id) on delete set null;
alter table training_tasks add column if not exists max_score numeric not null default 100;
alter table training_tasks add column if not exists score numeric;
alter table training_tasks add column if not exists feedback text;
alter table training_tasks add column if not exists evidence_path text;
alter table training_tasks add column if not exists evaluated_by uuid references profiles(id) on delete set null;
alter table training_tasks add column if not exists evaluated_at timestamptz;

create index if not exists idx_training_tasks_module_id on training_tasks(module_id);
create index if not exists idx_training_tasks_enrollment_id on training_tasks(enrollment_id);

create table if not exists certificates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  apprentice_id uuid not null references profiles(id) on delete cascade,
  program_id uuid not null references training_programs(id) on delete cascade,
  enrollment_id uuid not null references program_enrollments(id) on delete cascade,
  certificate_number text not null unique,
  verification_code text not null unique,
  final_score numeric not null,
  grade text not null,
  issued_at timestamptz not null default now(),
  issued_by uuid references profiles(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references profiles(id) on delete set null,
  revoked_reason text
);

create index if not exists idx_certificates_apprentice_id on certificates(apprentice_id);
create index if not exists idx_certificates_program_id on certificates(program_id);
create index if not exists idx_certificates_verification_code on certificates(verification_code);

alter table certificates enable row level security;

drop policy if exists "org members can read certificates" on certificates;
create policy "org members can read certificates" on certificates
  for select using (organization_id = current_org_id());
drop policy if exists "org members can issue certificates" on certificates;
create policy "org members can issue certificates" on certificates
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can revoke certificates" on certificates;
create policy "org members can revoke certificates" on certificates
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all certificates" on certificates;
create policy "super admin can read all certificates" on certificates
  for select using (current_role_name() = 'super_admin');
-- Public verification is deliberately narrow: only the columns the
-- /verify/[code] page actually needs, looked up by the unguessable
-- verification_code — never a browsable list. See get_certificate_for_verification()
-- below, which is what the page actually calls (SECURITY DEFINER, returns
-- one row scoped to an exact code match) rather than granting anon a
-- broad SELECT policy on the table.

create or replace function get_certificate_for_verification(code text)
returns table (
  certificate_number text,
  apprentice_name text,
  business_name text,
  program_name text,
  program_type text,
  grade text,
  final_score numeric,
  issued_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    c.certificate_number,
    p.full_name,
    o.name,
    tp.name,
    tp.program_type,
    c.grade,
    c.final_score,
    c.issued_at,
    c.revoked_at,
    c.revoked_reason
  from certificates c
  join profiles p on p.id = c.apprentice_id
  join organizations o on o.id = c.organization_id
  join training_programs tp on tp.id = c.program_id
  where c.verification_code = code;
end;
$$;

grant execute on function get_certificate_for_verification(text) to anon, authenticated;

-- Reference rows for the (not-yet-enforced) Roles & Permissions console —
-- keeps it an accurate map of the new module rather than a stale one.
insert into role_permissions (role, module, action, scope, allowed)
values
  ('owner', 'Training Programs', 'VIEW', 'BUSINESS', true),
  ('owner', 'Training Programs', 'MANAGE', 'BUSINESS', true),
  ('manager', 'Training Programs', 'VIEW', 'BUSINESS', true),
  ('manager', 'Training Programs', 'MANAGE', 'BUSINESS', true),
  ('trainer', 'Training Programs', 'VIEW', 'TEAM', true),
  ('trainer', 'Training Programs', 'APPROVE', 'TEAM', true),
  ('apprentice', 'Training Programs', 'VIEW', 'PERSONAL', true)
on conflict (role, module, action) do nothing;
