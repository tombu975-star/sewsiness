-- ============================================================
-- 043_tms_expansion.sql
--
-- Closes four gaps between the existing apprentice learning platform
-- (training_programs / training_modules / program_enrollments /
-- training_tasks / certificates — see 012_learning_platform.sql) and a
-- "standard" Training Management System:
--
--   training_sessions / session_attendance — scheduled classes
--     (workshop, fitting demo, TVET block class) with a roster and
--     present/absent/late/excused attendance, independent of the
--     free-form training_tasks assignment flow.
--
--   skills / apprentice_skill_levels — an org-defined competency list
--     (e.g. "Pattern drafting", "Overlocking") with a 0–5 proficiency
--     level per apprentice, assessed by a Trainer/Owner/Manager. This
--     is deliberately separate from training_modules: modules are
--     "did you do the unit", skills are "how good are you at the
--     underlying competency" — an apprentice can be assessed on a
--     skill without ever touching a formal program.
--
--   quizzes / quiz_questions / quiz_options / quiz_attempts /
--     quiz_attempt_answers — real multiple-choice, auto-scored
--     assessments, as opposed to training_tasks' manual
--     evidence-photo-plus-trainer-score flow. Correct answers
--     (quiz_options.is_correct) are never selected on the
--     apprentice-facing "take quiz" query — see submitQuizAttempt in
--     src/app/(app)/quizzes/actions.ts, which is the only place
--     scoring happens, using the admin client so it can see answers
--     the RLS policy below deliberately does not expose broadly.
--
--   certificates.expires_at — certificates could only ever be issued,
--     never expire. Nullable: most workplace-apprenticeship
--     certificates still never expire, but a TVET/compliance
--     certificate can now carry a real expiry date for the new
--     Training Compliance dashboard to surface.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

-- ---------------- Training sessions + attendance ----------------

create table if not exists training_sessions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  program_id uuid references training_programs(id) on delete set null,
  module_id uuid references training_modules(id) on delete set null,
  title text not null,
  description text,
  trainer_id uuid references profiles(id) on delete set null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_training_sessions_org_starts on training_sessions(organization_id, starts_at);
create index if not exists idx_training_sessions_trainer on training_sessions(trainer_id);

alter table training_sessions enable row level security;

drop policy if exists "org members can read training sessions" on training_sessions;
create policy "org members can read training sessions" on training_sessions
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write training sessions" on training_sessions;
create policy "org members can write training sessions" on training_sessions
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update training sessions" on training_sessions;
create policy "org members can update training sessions" on training_sessions
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all training sessions" on training_sessions;
create policy "super admin can read all training sessions" on training_sessions
  for select using (current_role_name() = 'super_admin');

create table if not exists session_attendance (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references training_sessions(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  apprentice_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'present', 'absent', 'late', 'excused')),
  checked_in_at timestamptz,
  checked_in_by uuid references profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (session_id, apprentice_id)
);

create index if not exists idx_session_attendance_session on session_attendance(session_id);
create index if not exists idx_session_attendance_apprentice on session_attendance(apprentice_id);

alter table session_attendance enable row level security;

drop policy if exists "org members can read session attendance" on session_attendance;
create policy "org members can read session attendance" on session_attendance
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write session attendance" on session_attendance;
create policy "org members can write session attendance" on session_attendance
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update session attendance" on session_attendance;
create policy "org members can update session attendance" on session_attendance
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all session attendance" on session_attendance;
create policy "super admin can read all session attendance" on session_attendance
  for select using (current_role_name() = 'super_admin');

-- ---------------- Skills / competency matrix ----------------

create table if not exists skills (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  category text,
  description text,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

alter table skills enable row level security;

drop policy if exists "org members can read skills" on skills;
create policy "org members can read skills" on skills
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write skills" on skills;
create policy "org members can write skills" on skills
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update skills" on skills;
create policy "org members can update skills" on skills
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all skills" on skills;
create policy "super admin can read all skills" on skills
  for select using (current_role_name() = 'super_admin');

-- level: 0 Not started · 1 Novice · 2 Developing · 3 Competent ·
-- 4 Proficient · 5 Expert (labeled client-side, kept numeric here so
-- the matrix view can sort/aggregate without a join).
create table if not exists apprentice_skill_levels (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  apprentice_id uuid not null references profiles(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  level int not null default 0 check (level >= 0 and level <= 5),
  assessed_by uuid references profiles(id) on delete set null,
  assessed_at timestamptz not null default now(),
  notes text,
  unique (apprentice_id, skill_id)
);

create index if not exists idx_apprentice_skill_levels_apprentice on apprentice_skill_levels(apprentice_id);
create index if not exists idx_apprentice_skill_levels_skill on apprentice_skill_levels(skill_id);

alter table apprentice_skill_levels enable row level security;

drop policy if exists "org members can read skill levels" on apprentice_skill_levels;
create policy "org members can read skill levels" on apprentice_skill_levels
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write skill levels" on apprentice_skill_levels;
create policy "org members can write skill levels" on apprentice_skill_levels
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update skill levels" on apprentice_skill_levels;
create policy "org members can update skill levels" on apprentice_skill_levels
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all skill levels" on apprentice_skill_levels;
create policy "super admin can read all skill levels" on apprentice_skill_levels
  for select using (current_role_name() = 'super_admin');

-- ---------------- Formal quizzes (auto-scored) ----------------

create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  program_id uuid references training_programs(id) on delete set null,
  module_id uuid references training_modules(id) on delete set null,
  title text not null,
  description text,
  pass_score numeric not null default 70 check (pass_score >= 0 and pass_score <= 100),
  time_limit_minutes int,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_quizzes_org on quizzes(organization_id);

alter table quizzes enable row level security;

drop policy if exists "org members can read quizzes" on quizzes;
create policy "org members can read quizzes" on quizzes
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write quizzes" on quizzes;
create policy "org members can write quizzes" on quizzes
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update quizzes" on quizzes;
create policy "org members can update quizzes" on quizzes
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all quizzes" on quizzes;
create policy "super admin can read all quizzes" on quizzes
  for select using (current_role_name() = 'super_admin');

create table if not exists quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  prompt text not null,
  sequence int not null default 1,
  points numeric not null default 1 check (points > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_quiz_questions_quiz on quiz_questions(quiz_id);

alter table quiz_questions enable row level security;

drop policy if exists "org members can read quiz questions" on quiz_questions;
create policy "org members can read quiz questions" on quiz_questions
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write quiz questions" on quiz_questions;
create policy "org members can write quiz questions" on quiz_questions
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update quiz questions" on quiz_questions;
create policy "org members can update quiz questions" on quiz_questions
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all quiz questions" on quiz_questions;
create policy "super admin can read all quiz questions" on quiz_questions
  for select using (current_role_name() = 'super_admin');

-- is_correct is readable by anyone who can read the org's quiz_options
-- row per RLS (same org-scoped policy as everything else) — the real
-- protection against an apprentice seeing the answer key before
-- submitting is that the "take quiz" page (src/app/(app)/quizzes/[id]/take/page.tsx)
-- simply never selects the is_correct column server-side, so it never
-- reaches the browser. See the file header note above.
create table if not exists quiz_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  sequence int not null default 1
);

create index if not exists idx_quiz_options_question on quiz_options(question_id);

alter table quiz_options enable row level security;

drop policy if exists "org members can read quiz options" on quiz_options;
create policy "org members can read quiz options" on quiz_options
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write quiz options" on quiz_options;
create policy "org members can write quiz options" on quiz_options
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update quiz options" on quiz_options;
create policy "org members can update quiz options" on quiz_options
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all quiz options" on quiz_options;
create policy "super admin can read all quiz options" on quiz_options
  for select using (current_role_name() = 'super_admin');

create table if not exists quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  apprentice_id uuid not null references profiles(id) on delete cascade,
  enrollment_id uuid references program_enrollments(id) on delete set null,
  attempt_number int not null default 1,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric,
  max_score numeric,
  passed boolean
);

create index if not exists idx_quiz_attempts_quiz on quiz_attempts(quiz_id);
create index if not exists idx_quiz_attempts_apprentice on quiz_attempts(apprentice_id);

alter table quiz_attempts enable row level security;

drop policy if exists "org members can read quiz attempts" on quiz_attempts;
create policy "org members can read quiz attempts" on quiz_attempts
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write quiz attempts" on quiz_attempts;
create policy "org members can write quiz attempts" on quiz_attempts
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update quiz attempts" on quiz_attempts;
create policy "org members can update quiz attempts" on quiz_attempts
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all quiz attempts" on quiz_attempts;
create policy "super admin can read all quiz attempts" on quiz_attempts
  for select using (current_role_name() = 'super_admin');

create table if not exists quiz_attempt_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  selected_option_id uuid references quiz_options(id) on delete set null,
  is_correct boolean,
  unique (attempt_id, question_id)
);

create index if not exists idx_quiz_attempt_answers_attempt on quiz_attempt_answers(attempt_id);

alter table quiz_attempt_answers enable row level security;

drop policy if exists "org members can read quiz attempt answers" on quiz_attempt_answers;
create policy "org members can read quiz attempt answers" on quiz_attempt_answers
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write quiz attempt answers" on quiz_attempt_answers;
create policy "org members can write quiz attempt answers" on quiz_attempt_answers
  for insert with check (organization_id = current_org_id());
drop policy if exists "super admin can read all quiz attempt answers" on quiz_attempt_answers;
create policy "super admin can read all quiz attempt answers" on quiz_attempt_answers
  for select using (current_role_name() = 'super_admin');

-- ---------------- Certificate expiry (compliance) ----------------

alter table certificates add column if not exists expires_at timestamptz;
create index if not exists idx_certificates_expires_at on certificates(expires_at);

-- ---------------- Roles & Permissions reference rows ----------------
-- Same not-yet-enforced reference-map pattern as 012_learning_platform.sql
-- — keeps the Roles & Permissions console accurate for the new modules.

insert into role_permissions (role, module, action, scope, allowed)
values
  ('owner', 'Training Sessions', 'VIEW', 'BUSINESS', true),
  ('owner', 'Training Sessions', 'MANAGE', 'BUSINESS', true),
  ('manager', 'Training Sessions', 'VIEW', 'BUSINESS', true),
  ('manager', 'Training Sessions', 'MANAGE', 'BUSINESS', true),
  ('trainer', 'Training Sessions', 'VIEW', 'TEAM', true),
  ('trainer', 'Training Sessions', 'MANAGE', 'TEAM', true),
  ('apprentice', 'Training Sessions', 'VIEW', 'PERSONAL', true),

  ('owner', 'Skills Matrix', 'VIEW', 'BUSINESS', true),
  ('owner', 'Skills Matrix', 'MANAGE', 'BUSINESS', true),
  ('manager', 'Skills Matrix', 'VIEW', 'BUSINESS', true),
  ('manager', 'Skills Matrix', 'MANAGE', 'BUSINESS', true),
  ('trainer', 'Skills Matrix', 'VIEW', 'TEAM', true),
  ('trainer', 'Skills Matrix', 'APPROVE', 'TEAM', true),
  ('apprentice', 'Skills Matrix', 'VIEW', 'PERSONAL', true),

  ('owner', 'Quizzes', 'VIEW', 'BUSINESS', true),
  ('owner', 'Quizzes', 'MANAGE', 'BUSINESS', true),
  ('manager', 'Quizzes', 'VIEW', 'BUSINESS', true),
  ('manager', 'Quizzes', 'MANAGE', 'BUSINESS', true),
  ('trainer', 'Quizzes', 'VIEW', 'TEAM', true),
  ('trainer', 'Quizzes', 'MANAGE', 'TEAM', true),
  ('apprentice', 'Quizzes', 'VIEW', 'PERSONAL', true),

  ('owner', 'Training Compliance', 'VIEW', 'BUSINESS', true),
  ('manager', 'Training Compliance', 'VIEW', 'BUSINESS', true),
  ('trainer', 'Training Compliance', 'VIEW', 'TEAM', true)
on conflict (role, module, action) do nothing;
