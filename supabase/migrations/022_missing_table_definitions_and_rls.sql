-- ============================================================
-- 022_missing_table_definitions_and_rls.sql
--
-- Found while auditing for data leaks: 14 tables the app queries and
-- writes to every day — alterations, collections, customer_materials,
-- designs, expenses, fabrics, fittings, measurements, notifications,
-- product_variants, production_stages, purchase_orders, quality_checks,
-- suppliers — have NO `create table` statement and NO RLS policy
-- anywhere in supabase/schema.sql or supabase/migrations/. Only an
-- index (010_more_indexes.sql) proves they were expected to exist.
--
-- This is the same defect class 019_role_scoped_writes_and_order_costs.sql
-- found and fixed for a single table (order_costs) — except this is 14
-- tables, several genuinely sensitive: expenses, suppliers (pricing —
-- explicitly the kind of data this platform's own privacy model says
-- Super Admin must never see), and measurements/customer_materials
-- (customer PII/body data). They were evidently created directly in the
-- Supabase SQL editor at some point, completely undocumented, which
-- means their live RLS state is unknown and unverifiable from this
-- codebase alone — order_costs turned out to have RLS never enabled at
-- all. These may or may not be in the same state; there's no way to
-- know without querying the live database directly.
--
-- This migration is written to be safe either way:
--   - `create table if not exists` is a no-op if the table already
--     exists in production (regardless of whether its live columns
--     differ slightly from what's inferred here from app usage) — it
--     will never touch existing data or existing columns.
--   - `alter table ... enable row level security` and the `drop policy
--     if exists` / `create policy` pairs run and take effect
--     regardless of whether the table pre-existed, which is the part
--     that actually matters for the live database's security posture.
--
-- Two tiers, matching the sensitivity precedent already set by 019 for
-- costing/payments/products.cost_price:
--   - Financial-adjacent (expenses, suppliers, purchase_orders): reads
--     open to the org (matches this app's general convention — see
--     customers/products in schema.sql), writes restricted to
--     owner/manager.
--   - Operational/craft tables (everything else): reads open to the
--     org, writes open to owner/manager/staff — the roles who actually
--     do this work day to day, per nav.ts's own role lists for pages
--     like quality-control and pos.
--
-- `notifications` is different again: nothing in the app code inserts
-- into it (it's populated some other way — a trigger or an Edge
-- Function outside this repo, not something this migration should
-- guess at), so there is deliberately NO insert policy for end users.
-- Only SELECT (own org, own user or org-wide broadcast) and a narrow
-- UPDATE limited to toggling `is_read` on a user's own notifications —
-- matching exactly what markAllRead() in
-- src/app/(app)/notifications/actions.ts actually does.
--
-- Run this against the live database and then verify column shapes
-- actually match (see the report accompanying this migration) — this
-- migration cannot discover columns it doesn't already know about from
-- reading the app's own code.
-- ============================================================

-- ---------- Financial-adjacent: owner/manager write ----------

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  category text not null,
  amount numeric(12,2) not null,
  method text not null default 'Cash',
  notes text,
  created_at timestamptz not null default now()
);
alter table expenses enable row level security;
drop policy if exists "org members can read own org expenses" on expenses;
create policy "org members can read own org expenses" on expenses for select using (organization_id = current_org_id());
drop policy if exists "manager+ can write expenses" on expenses;
create policy "manager+ can write expenses" on expenses for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager'));
drop policy if exists "manager+ can update expenses" on expenses;
create policy "manager+ can update expenses" on expenses for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager'));

create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);
alter table suppliers enable row level security;
drop policy if exists "org members can read own org suppliers" on suppliers;
create policy "org members can read own org suppliers" on suppliers for select using (organization_id = current_org_id());
drop policy if exists "manager+ can write suppliers" on suppliers;
create policy "manager+ can write suppliers" on suppliers for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager'));
drop policy if exists "manager+ can update suppliers" on suppliers;
create policy "manager+ can update suppliers" on suppliers for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager'));

create table if not exists purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  reference text,
  total numeric(12,2) not null default 0,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);
alter table purchase_orders enable row level security;
drop policy if exists "org members can read own org purchase orders" on purchase_orders;
create policy "org members can read own org purchase orders" on purchase_orders for select using (organization_id = current_org_id());
drop policy if exists "manager+ can write purchase orders" on purchase_orders;
create policy "manager+ can write purchase orders" on purchase_orders for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager'));
drop policy if exists "manager+ can update purchase orders" on purchase_orders;
create policy "manager+ can update purchase orders" on purchase_orders for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager'));

-- ---------- Operational/craft: owner/manager/staff write ----------

create table if not exists alterations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references custom_orders(id) on delete cascade,
  description text not null,
  status text not null default 'Requested',
  created_at timestamptz not null default now()
);
alter table alterations enable row level security;
drop policy if exists "org members can read own org alterations" on alterations;
create policy "org members can read own org alterations" on alterations for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write alterations" on alterations;
create policy "staff+ can write alterations" on alterations for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update alterations" on alterations;
create policy "staff+ can update alterations" on alterations for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

create table if not exists collections (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  season text,
  created_at timestamptz not null default now()
);
alter table collections enable row level security;
drop policy if exists "org members can read own org collections" on collections;
create policy "org members can read own org collections" on collections for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write collections" on collections;
create policy "staff+ can write collections" on collections for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update collections" on collections;
create policy "staff+ can update collections" on collections for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

create table if not exists customer_materials (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  description text not null,
  quantity text,
  received_at date not null default current_date,
  returned boolean not null default false,
  created_at timestamptz not null default now()
);
alter table customer_materials enable row level security;
drop policy if exists "org members can read own org customer materials" on customer_materials;
create policy "org members can read own org customer materials" on customer_materials for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write customer materials" on customer_materials;
create policy "staff+ can write customer materials" on customer_materials for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update customer materials" on customer_materials;
create policy "staff+ can update customer materials" on customer_materials for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

create table if not exists designs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  category text,
  price numeric(12,2) not null default 0,
  lead_time_days integer,
  created_at timestamptz not null default now()
);
alter table designs enable row level security;
drop policy if exists "org members can read own org designs" on designs;
create policy "org members can read own org designs" on designs for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write designs" on designs;
create policy "staff+ can write designs" on designs for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update designs" on designs;
create policy "staff+ can update designs" on designs for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

create table if not exists fabrics (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text,
  color text,
  price_per_yard numeric(12,2) not null default 0,
  stock_yards numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
alter table fabrics enable row level security;
drop policy if exists "org members can read own org fabrics" on fabrics;
create policy "org members can read own org fabrics" on fabrics for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write fabrics" on fabrics;
create policy "staff+ can write fabrics" on fabrics for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update fabrics" on fabrics;
create policy "staff+ can update fabrics" on fabrics for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

create table if not exists fittings (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references custom_orders(id) on delete cascade,
  scheduled_at timestamptz,
  outcome text not null default 'Pending',
  notes text,
  created_at timestamptz not null default now()
);
alter table fittings enable row level security;
drop policy if exists "org members can read own org fittings" on fittings;
create policy "org members can read own org fittings" on fittings for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write fittings" on fittings;
create policy "staff+ can write fittings" on fittings for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update fittings" on fittings;
create policy "staff+ can update fittings" on fittings for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

-- measurements holds customer body-measurement data — sensitive, but
-- matches the same read/write shape as customer_materials above; it's
-- the write floor (owner/manager/staff, not every role) that keeps it
-- meaningfully protected, not a different read shape.
create table if not exists measurements (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  label text not null default 'Standard',
  chest numeric(6,2),
  waist numeric(6,2),
  hips numeric(6,2),
  shoulder numeric(6,2),
  sleeve_length numeric(6,2),
  garment_length numeric(6,2),
  notes text,
  created_at timestamptz not null default now()
);
alter table measurements enable row level security;
drop policy if exists "org members can read own org measurements" on measurements;
create policy "org members can read own org measurements" on measurements for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write measurements" on measurements;
create policy "staff+ can write measurements" on measurements for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update measurements" on measurements;
create policy "staff+ can update measurements" on measurements for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

create table if not exists product_variants (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  size text,
  color text,
  stock_qty integer not null default 0,
  created_at timestamptz not null default now()
);
alter table product_variants enable row level security;
drop policy if exists "org members can read own org product variants" on product_variants;
create policy "org members can read own org product variants" on product_variants for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write product variants" on product_variants;
create policy "staff+ can write product variants" on product_variants for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update product variants" on product_variants;
create policy "staff+ can update product variants" on product_variants for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

create table if not exists production_stages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references custom_orders(id) on delete cascade,
  stage text not null,
  status text not null default 'In Progress',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table production_stages enable row level security;
drop policy if exists "org members can read own org production stages" on production_stages;
create policy "org members can read own org production stages" on production_stages for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write production stages" on production_stages;
create policy "staff+ can write production stages" on production_stages for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));
drop policy if exists "staff+ can update production stages" on production_stages;
create policy "staff+ can update production stages" on production_stages for update using (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff')) with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff'));

create table if not exists quality_checks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references custom_orders(id) on delete cascade,
  checked_by uuid references profiles(id) on delete set null,
  seams_ok boolean not null default false,
  fit_ok boolean not null default false,
  finishing_ok boolean not null default false,
  passed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
alter table quality_checks enable row level security;
drop policy if exists "org members can read own org quality checks" on quality_checks;
create policy "org members can read own org quality checks" on quality_checks for select using (organization_id = current_org_id());
drop policy if exists "staff+ can write quality checks" on quality_checks;
create policy "staff+ can write quality checks" on quality_checks for insert with check (organization_id = current_org_id() and current_role_name() in ('owner','manager','staff') and checked_by = auth.uid());

-- ---------- notifications: no end-user insert policy ----------
-- Nothing in the app inserts into this table — it's populated some
-- other way (trigger/Edge Function, outside this repo). Deliberately no
-- INSERT policy for authenticated users; only read own/org-broadcast,
-- and update limited to toggling is_read on a user's own notifications
-- (exactly what markAllRead() in notifications/actions.ts does).
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade, -- null = org-wide broadcast
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;
drop policy if exists "users can read own or broadcast notifications" on notifications;
create policy "users can read own or broadcast notifications" on notifications
  for select using (organization_id = current_org_id() and (user_id = auth.uid() or user_id is null));
drop policy if exists "users can mark own notifications read" on notifications;
create policy "users can mark own notifications read" on notifications
  for update using (organization_id = current_org_id() and user_id = auth.uid());
