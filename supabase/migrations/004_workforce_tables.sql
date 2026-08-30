-- ============================================================
-- 004_workforce_tables.sql
-- Three tables the app has been querying since before this migration
-- history started, but that were never actually created:
--   - training_tasks        (src/app/(app)/training-plans)
--   - portfolio_items       (src/app/(app)/portfolios)
--   - work_requests         (src/app/(app)/freelancer-work-requests,
--                             src/app/(app)/freelancer-payments)
-- Every Owner/Manager/Apprentice/Freelancer hitting those four pages has
-- been getting a "relation does not exist" error. This creates the
-- tables for real, with the same "any org member can read/write within
-- their own org" RLS style already used for payments/apprentice_profiles/
-- freelancer_profiles elsewhere in schema.sql, plus a super-admin
-- read-all policy on each so the new platform-level overview pages can
-- aggregate across every business.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists training_tasks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  apprentice_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  status text not null default 'Assigned' check (status in ('Assigned', 'In Progress', 'Done')),
  due_date date,
  created_at timestamptz not null default now()
);

alter table training_tasks enable row level security;

drop policy if exists "org members can read training tasks" on training_tasks;
create policy "org members can read training tasks" on training_tasks
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write training tasks" on training_tasks;
create policy "org members can write training tasks" on training_tasks
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update training tasks" on training_tasks;
create policy "org members can update training tasks" on training_tasks
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all training tasks" on training_tasks;
create policy "super admin can read all training tasks" on training_tasks
  for select using (current_role_name() = 'super_admin');

create table if not exists portfolio_items (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  apprentice_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table portfolio_items enable row level security;

drop policy if exists "org members can read portfolio items" on portfolio_items;
create policy "org members can read portfolio items" on portfolio_items
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write portfolio items" on portfolio_items;
create policy "org members can write portfolio items" on portfolio_items
  for insert with check (organization_id = current_org_id());
drop policy if exists "super admin can read all portfolio items" on portfolio_items;
create policy "super admin can read all portfolio items" on portfolio_items
  for select using (current_role_name() = 'super_admin');

create table if not exists work_requests (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  freelancer_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  amount numeric not null default 0,
  status text not null default 'Offered' check (status in ('Offered', 'Accepted', 'Completed', 'Paid', 'Declined')),
  created_at timestamptz not null default now()
);

alter table work_requests enable row level security;

drop policy if exists "org members can read work requests" on work_requests;
create policy "org members can read work requests" on work_requests
  for select using (organization_id = current_org_id());
drop policy if exists "org members can write work requests" on work_requests;
create policy "org members can write work requests" on work_requests
  for insert with check (organization_id = current_org_id());
drop policy if exists "org members can update work requests" on work_requests;
create policy "org members can update work requests" on work_requests
  for update using (organization_id = current_org_id()) with check (organization_id = current_org_id());
drop policy if exists "super admin can read all work requests" on work_requests;
create policy "super admin can read all work requests" on work_requests
  for select using (current_role_name() = 'super_admin');
