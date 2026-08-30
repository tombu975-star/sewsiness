-- ============================================================
-- 002_platform_admin.sql
-- Adds real backing for Super Admin's "Enrolled Businesses" screens.
--
-- Everything here is additive (create-if-not-exists / add-column-if-not-
-- exists) so it is safe to run against the live database as-is, even
-- though it has drifted from supabase/schema.sql. Run this once in the
-- Supabase SQL editor.
--
-- What this does:
--   1. Lets a Super Admin profile exist with organization_id = NULL — a
--      true platform-level account, not tied to any one business.
--   2. Adds a couple of lightweight fields to `organizations` so the
--      platform list has something to show (region, plan, status).
--   3. Adds `advisory_notes` — messages Super Admin sends to a specific
--      business's Owner/Manager. RLS-scoped both ways.
--   4. Adds two SECURITY DEFINER functions that hand Super Admin
--      *operational signals only* (order volume, overdue counts, QC pass
--      rate, current production-stage counts) — never revenue, invoices,
--      or customer names. These bypass RLS internally (by design, since
--      that's the whole point of a definer function) but check the
--      caller's role themselves and refuse anyone who isn't super_admin.
-- ============================================================

-- 1. Let Super Admin be organization-less -----------------------------
alter table profiles alter column organization_id drop not null;

-- Every user must still be able to read their own profile row even when
-- they have no organization (the existing "org members can read profiles
-- in org" policy can't match a NULL organization_id against itself).
drop policy if exists "users can read own profile" on profiles;
create policy "users can read own profile" on profiles
  for select using (id = auth.uid());

-- 2. Business-directory fields on organizations ------------------------
alter table organizations add column if not exists region text;
alter table organizations add column if not exists plan text not null default 'Standard';
alter table organizations add column if not exists status text not null default 'Active'
  check (status in ('Active', 'Paused'));

-- Super Admin needs to see the list of all businesses (name, region,
-- plan, enrolled date only — nothing financial lives on this table).
drop policy if exists "super admin can read all organizations" on organizations;
create policy "super admin can read all organizations" on organizations
  for select using (current_role_name() = 'super_admin');

-- 3. Advisory notes: Super Admin -> a specific business's leadership ---
create table if not exists advisory_notes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  author_id uuid not null references profiles(id),
  message text not null,
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

alter table advisory_notes enable row level security;

drop policy if exists "super_admin_manage_advisory_notes" on advisory_notes;
create policy "super_admin_manage_advisory_notes" on advisory_notes
  for all
  using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');

drop policy if exists "org_leadership_read_advisory_notes" on advisory_notes;
create policy "org_leadership_read_advisory_notes" on advisory_notes
  for select using (organization_id = current_org_id());

drop policy if exists "org_leadership_mark_advisory_notes_seen" on advisory_notes;
create policy "org_leadership_mark_advisory_notes_seen" on advisory_notes
  for update
  using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

-- 4. Cross-tenant operational signals (no financial/customer data) -----

-- One row per business: order volume, overdue count, QC pass rate, and a
-- transparent 0-100 health score computed from those two signals only.
-- Formula (documented so it's never a mystery number):
--   overdue_ratio = orders_overdue / orders_in_progress (0 when none in progress)
--   qc_component  = qc_pass_rate if any QC checks exist, else 80 (neutral —
--                   not enough data yet to say either way)
--   health_score  = round(60 * (1 - overdue_ratio) + 40 * qc_component / 100)
create or replace function get_business_directory()
returns table (
  organization_id uuid,
  organization_name text,
  region text,
  plan text,
  status text,
  enrolled_at timestamptz,
  owner_name text,
  total_users int,
  orders_total int,
  orders_in_progress int,
  orders_overdue int,
  qc_checks_run int,
  qc_pass_rate numeric,
  health_score int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_role_name(), '') <> 'super_admin' then
    raise exception 'not authorized';
  end if;

  return query
  select
    o.id,
    o.name,
    o.region,
    o.plan,
    o.status,
    o.created_at,
    (select p.full_name from profiles p where p.organization_id = o.id and p.role = 'owner' order by p.created_at limit 1),
    (select count(*)::int from profiles p where p.organization_id = o.id),
    count(distinct co.id)::int,
    count(distinct co.id) filter (where co.status not in ('Completed', 'Cancelled'))::int,
    count(distinct co.id) filter (where co.due_date < now() and co.status not in ('Completed', 'Cancelled'))::int,
    count(distinct qc.id)::int,
    round((100.0 * count(distinct qc.id) filter (where qc.passed = true) / nullif(count(distinct qc.id), 0))::numeric, 0),
    round((
      60 * (1 - (
        count(distinct co.id) filter (where co.due_date < now() and co.status not in ('Completed', 'Cancelled'))::numeric
        / nullif(count(distinct co.id) filter (where co.status not in ('Completed', 'Cancelled')), 0)
      )) +
      40 * coalesce(
        100.0 * count(distinct qc.id) filter (where qc.passed = true) / nullif(count(distinct qc.id), 0),
        80
      ) / 100
    )::numeric, 0)::int
  from organizations o
  left join custom_orders co on co.organization_id = o.id
  left join quality_checks qc on qc.organization_id = o.id
  group by o.id, o.name, o.region, o.plan, o.status, o.created_at
  order by o.name;
end;
$$;

grant execute on function get_business_directory() to authenticated;

-- Current-stage order counts for one business's production board — used
-- on the business detail screen. Mirrors the same "first stage not marked
-- Done" logic the Production board itself uses.
create or replace function get_business_stage_breakdown(target_org uuid)
returns table (stage text, order_count int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_role_name(), '') <> 'super_admin' then
    raise exception 'not authorized';
  end if;

  return query
  with target_stages(stage, ord) as (
    values ('Cutting', 1), ('Sewing', 2), ('Finishing', 3), ('Pressing', 4), ('Ready', 5)
  ),
  order_current_stage as (
    select
      co.id as order_id,
      coalesce(
        (
          select ts.stage from target_stages ts
          where ts.stage <> 'Ready'
            and not exists (
              select 1 from production_stages ps
              where ps.order_id = co.id and ps.stage = ts.stage and ps.status = 'Done'
            )
          order by ts.ord
          limit 1
        ),
        'Ready'
      ) as stage
    from custom_orders co
    where co.organization_id = target_org
      and co.status not in ('Completed', 'Cancelled')
  )
  select ts.stage, coalesce(count(ocs.order_id), 0)::int
  from target_stages ts
  left join order_current_stage ocs on ocs.stage = ts.stage
  group by ts.stage, ts.ord
  order by ts.ord;
end;
$$;

grant execute on function get_business_stage_breakdown(uuid) to authenticated;
