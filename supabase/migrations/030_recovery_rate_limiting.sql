-- ============================================================
-- 030_recovery_rate_limiting.sql
--
-- src/app/forgot-account/actions.ts's submitAccountRecovery() is a
-- public, unauthenticated form that inserts into
-- account_recovery_requests on every submission — a table Super Admin
-- actually works from (src/app/(app)/admin/account-requests) to help
-- real business owners. With no rate limit, that queue can be flooded
-- with garbage by anyone scripting POSTs against it, burying real
-- requests. Same shape as 024_signup_rate_limiting.sql — a genuine
-- Server Action, so it checks this table directly via the admin client
-- already imported in that file, no anon-callable RPC needed.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists recovery_attempts (
  id bigserial primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_recovery_attempts_ip_time on recovery_attempts (ip, created_at desc);

alter table recovery_attempts enable row level security;
-- No policies — reachable only via the admin/service-role client, same
-- reasoning as login_attempts and signup_attempts.
