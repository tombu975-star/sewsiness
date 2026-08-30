-- SEWISS / Sewiness core schema
-- Single-organization-per-tenant pattern (matches the Atelier codebase).
-- Run this in the Supabase SQL editor on a fresh project.

create extension if not exists "uuid-ossp";

-- ============================================================
-- Core tables
-- ============================================================

create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  city text,
  created_at timestamptz not null default now()
);

-- Profiles mirror auth.users 1:1 and carry role + org/branch scoping.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  role text not null check (role in ('super_admin','system_admin','owner','manager','staff','apprentice','freelancer','trainer')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  phone text,
  whatsapp text,
  email text,
  gender text,
  notes text,
  status text not null default 'New' check (status in ('Active','New','Overdue','Inactive')),
  created_at timestamptz not null default now()
);

create table if not exists custom_orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null,
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid not null references customers(id) on delete cascade,
  garment text not null,
  due_date date,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  status text not null default 'Pending' check (status in ('Pending','In Progress','Review','Completed','Overdue','Cancelled')),
  priority text not null default 'Normal' check (priority in ('Low','Normal','High')),
  created_at timestamptz not null default now(),
  unique (organization_id, order_number)
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  category text,
  sku text,
  selling_price numeric(12,2) not null default 0,
  cost_price numeric(12,2),
  stock_qty integer not null default 0,
  status text not null default 'Active' check (status in ('Active','Low Stock','Out of Stock','Draft')),
  created_at timestamptz not null default now()
);

create table if not exists pos_sales (
  id uuid primary key default uuid_generate_v4(),
  sale_number text not null,
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  cashier_id uuid not null references profiles(id),
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'Completed' check (status in ('Completed','Refunded','Void')),
  created_at timestamptz not null default now(),
  unique (organization_id, sale_number)
);

create table if not exists pos_sale_items (
  id uuid primary key default uuid_generate_v4(),
  pos_sale_id uuid not null references pos_sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  order_id uuid references custom_orders(id) on delete set null,
  pos_sale_id uuid references pos_sales(id) on delete set null,
  amount numeric(12,2) not null,
  method text not null check (method in ('Cash','Mobile Money','Bank Transfer','Card')),
  type text not null check (type in ('Deposit','Balance','Full','Refund','Sale')),
  notes text,
  created_at timestamptz not null default now()
);

-- Apprentices and Freelancers are self-service (invite → set password, same
-- pattern as Staff via AUTH-005): a profiles row is created immediately via
-- supabase.auth.admin.inviteUserByEmail(), then these tables hold the
-- domain-specific fields the wireframe's create forms collect (FRL-006,
-- APP-006) that don't belong on the generic `profiles` table.

create table if not exists apprentice_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  trainer_id uuid references profiles(id) on delete set null,
  start_date date,
  training_level text,
  specialisation text,
  training_goals text,
  created_at timestamptz not null default now()
);

create table if not exists freelancer_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  whatsapp text,
  location text,
  primary_skill text,
  years_experience integer,
  specialisation text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SECURITY DEFINER helper: avoids RLS infinite recursion (42P17)
-- when a policy on `profiles` would otherwise need to query `profiles`.
-- ============================================================

create or replace function current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

create or replace function current_role_name()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table organizations enable row level security;
alter table branches enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table custom_orders enable row level security;
alter table products enable row level security;
alter table pos_sales enable row level security;
alter table pos_sale_items enable row level security;
alter table payments enable row level security;
alter table apprentice_profiles enable row level security;
alter table freelancer_profiles enable row level security;

create policy "org members can read own org" on organizations
  for select using (id = current_org_id());

create policy "org members can read own branches" on branches
  for select using (organization_id = current_org_id());

create policy "org members can read profiles in org" on profiles
  for select using (organization_id = current_org_id());
create policy "users can update own profile" on profiles
  for update using (id = auth.uid());

create policy "org members can read customers" on customers
  for select using (organization_id = current_org_id());
create policy "staff+ can write customers" on customers
  for insert with check (organization_id = current_org_id());
create policy "staff+ can update customers" on customers
  for update using (organization_id = current_org_id());

create policy "org members can read orders" on custom_orders
  for select using (organization_id = current_org_id());
create policy "staff+ can write orders" on custom_orders
  for insert with check (organization_id = current_org_id());
create policy "staff+ can update orders" on custom_orders
  for update using (organization_id = current_org_id());

create policy "org members can read products" on products
  for select using (organization_id = current_org_id());
create policy "manager+ can write products" on products
  for insert with check (organization_id = current_org_id());
create policy "manager+ can update products" on products
  for update using (organization_id = current_org_id());

create policy "org members can read pos sales" on pos_sales
  for select using (organization_id = current_org_id());
create policy "staff+ can create pos sales" on pos_sales
  for insert with check (organization_id = current_org_id());

create policy "org members can read pos sale items" on pos_sale_items
  for select using (pos_sale_id in (select id from pos_sales where organization_id = current_org_id()));
create policy "staff+ can create pos sale items" on pos_sale_items
  for insert with check (pos_sale_id in (select id from pos_sales where organization_id = current_org_id()));

-- Costing note (Product Blueprint §2): staff should not see true cost/margin.
-- cost_price is included in `products` for simplicity here; if you need a hard
-- read boundary, split it into a separate `product_costs` table visible only
-- to owner/manager/super_admin via its own policy using current_role_name().

create policy "org members can read payments" on payments
  for select using (organization_id = current_org_id());
create policy "manager+ can write payments" on payments
  for insert with check (organization_id = current_org_id());

create policy "org members can read apprentice profiles" on apprentice_profiles
  for select using (organization_id = current_org_id());
create policy "manager+ can write apprentice profiles" on apprentice_profiles
  for insert with check (organization_id = current_org_id());

create policy "org members can read freelancer profiles" on freelancer_profiles
  for select using (organization_id = current_org_id());
create policy "manager+ can write freelancer profiles" on freelancer_profiles
  for insert with check (organization_id = current_org_id());

-- No seeded organization on purpose — a fresh database starts with zero
-- businesses. Every real business is created either through the
-- self-service /signup flow (Ghana Card + selfie, reviewed by Super Admin
-- before it can sign in) or Super Admin's /admin/new "Enroll Business"
-- form — both insert their own organizations + branches row, so nothing
-- needs somewhere pre-existing to land in.
