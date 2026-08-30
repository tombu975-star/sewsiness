-- ============================================================
-- 010_api_integrations.sql
--
-- Third-party API access, the way most B2B SaaS products expose one:
-- scoped API keys (never stored in plaintext — only a sha256 hash, like
-- a password) plus outbound webhooks for real-time events. Both are
-- managed from /settings/integrations by Owner/Manager only.
--
--   api_keys          — key_hash is what's checked on every request;
--                        key_prefix is only for the person to recognize
--                        which key is which in the UI ("sk_live_a1b2...").
--                        The full secret is shown exactly once, at
--                        creation, in the UI — never stored, never
--                        retrievable again after that.
--   webhooks           — a URL + which events to send it + a signing
--                        secret (HMAC-SHA256 over the payload, sent as
--                        the X-Sewsiness-Signature header, the same
--                        pattern Stripe/GitHub webhooks use) so the
--                        receiver can verify a payload really came from
--                        Sewsiness.
--   webhook_deliveries — a log of every attempt (status code, success,
--                        error) — without this, a failed integration is
--                        invisible until the third party complains.
--   api_request_logs   — backs a simple per-key rate limit (see
--                        check_api_rate_limit below) and gives Owner/
--                        Manager visibility into what's actually calling
--                        their API.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists api_keys (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references profiles(id) on delete set null
);

create index if not exists idx_api_keys_organization_id on api_keys(organization_id);
create index if not exists idx_api_keys_key_hash on api_keys(key_hash);

alter table api_keys enable row level security;

-- Only Owner/Manager manage keys — Staff/Trainer/Apprentice/Freelancer
-- have no business generating platform API credentials.
drop policy if exists "owner/manager can read api keys" on api_keys;
create policy "owner/manager can read api keys" on api_keys
  for select using (organization_id = current_org_id() and current_role_name() in ('owner', 'manager'));
drop policy if exists "owner/manager can create api keys" on api_keys;
create policy "owner/manager can create api keys" on api_keys
  for insert with check (organization_id = current_org_id() and current_role_name() in ('owner', 'manager'));
drop policy if exists "owner/manager can revoke api keys" on api_keys;
create policy "owner/manager can revoke api keys" on api_keys
  for update using (organization_id = current_org_id() and current_role_name() in ('owner', 'manager'))
  with check (organization_id = current_org_id());
drop policy if exists "super admin can read all api keys" on api_keys;
create policy "super admin can read all api keys" on api_keys
  for select using (current_role_name() = 'super_admin');
-- Deliberately no policy grants anon/authenticated a way to read key_hash
-- and match it themselves — API requests are authenticated by a Route
-- Handler using the service-role client (src/lib/supabase/admin.ts) to
-- look up the hash, the same way you'd check a password server-side
-- rather than via a client-readable table.

create table if not exists webhooks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  url text not null,
  secret text not null,
  events text[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhooks_organization_id on webhooks(organization_id);

alter table webhooks enable row level security;

drop policy if exists "owner/manager can read webhooks" on webhooks;
create policy "owner/manager can read webhooks" on webhooks
  for select using (organization_id = current_org_id() and current_role_name() in ('owner', 'manager'));
drop policy if exists "owner/manager can create webhooks" on webhooks;
create policy "owner/manager can create webhooks" on webhooks
  for insert with check (organization_id = current_org_id() and current_role_name() in ('owner', 'manager'));
drop policy if exists "owner/manager can update webhooks" on webhooks;
create policy "owner/manager can update webhooks" on webhooks
  for update using (organization_id = current_org_id() and current_role_name() in ('owner', 'manager'))
  with check (organization_id = current_org_id());
drop policy if exists "super admin can read all webhooks" on webhooks;
create policy "super admin can read all webhooks" on webhooks
  for select using (current_role_name() = 'super_admin');

create table if not exists webhook_deliveries (
  id uuid primary key default uuid_generate_v4(),
  webhook_id uuid not null references webhooks(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  response_status int,
  success boolean not null default false,
  error_message text,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_webhook_deliveries_webhook_id on webhook_deliveries(webhook_id);
create index if not exists idx_webhook_deliveries_organization_id on webhook_deliveries(organization_id);

alter table webhook_deliveries enable row level security;

drop policy if exists "owner/manager can read webhook deliveries" on webhook_deliveries;
create policy "owner/manager can read webhook deliveries" on webhook_deliveries
  for select using (organization_id = current_org_id() and current_role_name() in ('owner', 'manager'));
drop policy if exists "super admin can read all webhook deliveries" on webhook_deliveries;
create policy "super admin can read all webhook deliveries" on webhook_deliveries
  for select using (current_role_name() = 'super_admin');
-- Insert only ever happens from the service-role webhook dispatcher
-- (src/lib/webhooks.ts), which bypasses RLS by design — no
-- authenticated/anon insert policy is needed or added.

create table if not exists api_request_logs (
  id uuid primary key default uuid_generate_v4(),
  api_key_id uuid not null references api_keys(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  path text not null,
  method text not null,
  status_code int,
  requested_at timestamptz not null default now()
);

create index if not exists idx_api_request_logs_api_key_id on api_request_logs(api_key_id);
create index if not exists idx_api_request_logs_organization_id on api_request_logs(organization_id);
-- Powers check_api_rate_limit()'s "count requests in the last 60s" query.
create index if not exists idx_api_request_logs_key_time on api_request_logs(api_key_id, requested_at);

alter table api_request_logs enable row level security;

drop policy if exists "owner/manager can read api request logs" on api_request_logs;
create policy "owner/manager can read api request logs" on api_request_logs
  for select using (organization_id = current_org_id() and current_role_name() in ('owner', 'manager'));
drop policy if exists "super admin can read all api request logs" on api_request_logs;
create policy "super admin can read all api request logs" on api_request_logs
  for select using (current_role_name() = 'super_admin');

-- Simple sliding-window rate limit: counts this key's requests in the
-- last 60 seconds, logs the current one, and returns whether it's still
-- under the limit. One extra DB round-trip per API request — fine for a
-- single-region setup at this scale; swap for Redis/Upstash if API
-- traffic ever justifies it, without changing the route handlers that
-- call this (they only care about the boolean).
create or replace function check_api_rate_limit(
  p_api_key_id uuid,
  p_organization_id uuid,
  p_path text,
  p_method text,
  p_limit_per_minute int default 120
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from api_request_logs
  where api_key_id = p_api_key_id and requested_at > now() - interval '60 seconds';

  insert into api_request_logs (api_key_id, organization_id, path, method)
  values (p_api_key_id, p_organization_id, p_path, p_method);

  return recent_count < p_limit_per_minute;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default on new functions — this one
-- is only ever meant to be called from src/lib/api/auth.ts using the
-- service-role client, never directly by a signed-in user or anon.
revoke execute on function check_api_rate_limit(uuid, uuid, text, text, int) from public;

-- Reference rows for the Roles & Permissions console.
insert into role_permissions (role, module, action, scope, allowed)
values
  ('owner', 'API & Integrations', 'MANAGE', 'BUSINESS', true),
  ('manager', 'API & Integrations', 'MANAGE', 'BUSINESS', true)
on conflict (role, module, action) do nothing;
