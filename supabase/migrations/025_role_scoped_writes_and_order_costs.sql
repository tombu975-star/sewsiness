-- ============================================================
-- 025_role_scoped_writes_and_order_costs.sql
--
-- Two fixes found in a full data-access review.
--
-- ------------------------------------------------------------
-- 1) CRITICAL — order_costs was never actually created.
--
-- src/app/(app)/costing/actions.ts (saveOrderCost) and
-- src/app/(app)/costing/page.tsx both read/write a table called
-- `order_costs`, and 010_more_indexes.sql even indexes it — but no
-- `create table order_costs` exists anywhere in schema.sql or any
-- migration. On a database built from this repo (per the README's own
-- setup steps) costing would simply error out. Worse, if this table was
-- ever created ad hoc directly in the Supabase SQL editor (outside this
-- repo) to unblock testing, Supabase's default grants to `anon`/
-- `authenticated` on new public-schema tables mean it would sit fully
-- readable/writable by any signed-in user — including the lowest-
-- privilege Apprentice or Freelancer account, and it holds exactly the
-- margin data (fabric/labor/overhead cost per order) the product
-- blueprint and this app's own UI (`restrictedCosting` in
-- orders/[id]/page.tsx, the role check in costing/page.tsx) says only
-- Owner/Manager/Super Admin may see. Defining it here, RLS-scoped from
-- the start, closes that gap and matches the app-layer checks that
-- already exist.
--
-- 2) HIGH — several RLS policy NAMES promise a role floor
-- ("manager+ can write products", "staff+ can write customers", etc.)
-- that their policy BODY never actually checked — only
-- `organization_id = current_org_id()`. That means, independent of
-- anything the Next.js app does, the Supabase REST API (using nothing
-- more than the public anon key + a valid session) would let ANY member
-- of an organization — down to Apprentice or Freelancer — insert/update
-- products (incl. cost_price), record payments, write
-- apprentice/freelancer profiles, or create customers/orders, even
-- though the UI only shows those actions to Staff+/Manager+. This tightens
-- each policy to actually match its own name.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

-- ------------------------------------------------------------
-- 1) order_costs
-- ------------------------------------------------------------

create table if not exists order_costs (
  order_id uuid primary key references custom_orders(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  fabric_cost numeric not null default 0,
  labor_cost numeric not null default 0,
  overhead_cost numeric not null default 0,
  other_cost numeric not null default 0,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

create index if not exists idx_order_costs_organization_id on order_costs(organization_id);

alter table order_costs enable row level security;

-- Same boundary as the app's own UI checks: Owner, Manager, Super Admin
-- only — Staff and below never see or write margin data.
drop policy if exists "owner_manager_read_order_costs" on order_costs;
create policy "owner_manager_read_order_costs" on order_costs
  for select using (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  );

drop policy if exists "owner_manager_write_order_costs" on order_costs;
create policy "owner_manager_write_order_costs" on order_costs
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  );

drop policy if exists "owner_manager_update_order_costs" on order_costs;
create policy "owner_manager_update_order_costs" on order_costs
  for update
  using (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  )
  with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  );

-- ------------------------------------------------------------
-- 2) Tighten write policies to match their own stated role floor
-- ------------------------------------------------------------

-- Products — "manager+" (cost_price lives here; see schema.sql's own
-- note that this table needs its documented role boundary honoured).
drop policy if exists "manager+ can write products" on products;
create policy "manager+ can write products" on products
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  );

drop policy if exists "manager+ can update products" on products;
create policy "manager+ can update products" on products
  for update
  using (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  )
  with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  );

-- Customers — "staff+" (Owner/Manager/Staff; Apprentice/Freelancer/
-- Trainer excluded).
drop policy if exists "staff+ can write customers" on customers;
create policy "staff+ can write customers" on customers
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'staff', 'super_admin')
  );

drop policy if exists "staff+ can update customers" on customers;
create policy "staff+ can update customers" on customers
  for update
  using (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'staff', 'super_admin')
  )
  with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'staff', 'super_admin')
  );

-- Custom orders — "staff+"
drop policy if exists "staff+ can write orders" on custom_orders;
create policy "staff+ can write orders" on custom_orders
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'staff', 'super_admin')
  );

drop policy if exists "staff+ can update orders" on custom_orders;
create policy "staff+ can update orders" on custom_orders
  for update
  using (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'staff', 'super_admin')
  )
  with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'staff', 'super_admin')
  );

-- POS sales / sale items — "staff+" (the terminal itself is a Staff+
-- workflow; Apprentice/Freelancer/Trainer have no POS access in the nav).
drop policy if exists "staff+ can create pos sales" on pos_sales;
create policy "staff+ can create pos sales" on pos_sales
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'staff', 'super_admin')
  );

drop policy if exists "staff+ can create pos sale items" on pos_sale_items;
create policy "staff+ can create pos sale items" on pos_sale_items
  for insert with check (
    pos_sale_id in (
      select id from pos_sales
      where organization_id = current_org_id()
    )
    and current_role_name() in ('owner', 'manager', 'staff', 'super_admin')
  );

-- Payments — "manager+"
drop policy if exists "manager+ can write payments" on payments;
create policy "manager+ can write payments" on payments
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  );

-- Apprentice / freelancer profiles — "manager+" (Trainers propose
-- training plans elsewhere, but enrolling the workforce record itself
-- stays Manager+, matching the existing policy name).
drop policy if exists "manager+ can write apprentice profiles" on apprentice_profiles;
create policy "manager+ can write apprentice profiles" on apprentice_profiles
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  );

drop policy if exists "manager+ can write freelancer profiles" on freelancer_profiles;
create policy "manager+ can write freelancer profiles" on freelancer_profiles
  for insert with check (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager', 'super_admin')
  );
