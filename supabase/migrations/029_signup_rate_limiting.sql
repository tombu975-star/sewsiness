-- ============================================================
-- 029_signup_rate_limiting.sql
--
-- src/app/signup/actions.ts's submitBusinessSignup() had no limit on
-- how many times it could be called. Each call uploads two Ghana Card
-- images and a selfie to Storage before any human review happens — so
-- unlike a plain form-spam problem, this is also a storage-cost and
-- KYC-queue-flooding problem (a queue of hundreds of fake pending
-- verifications makes it harder for Super Admin to find the real ones).
--
-- Different shape from 021_login_rate_limiting.sql's limiter: signup is
-- a genuine Next.js Server Action (not a client-side call straight to
-- Supabase Auth), so it can check this table directly using the
-- existing admin/service-role client already imported in
-- signup/actions.ts — no anon-callable RPC function needed, since
-- there's no browser-side caller to grant execute to.
--
-- Keyed by IP (via the x-forwarded-for header Render's proxy sets),
-- not email — every signup uses a fresh email by definition, so email
-- can't be the rate-limit key the way it is for login.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists signup_attempts (
  id bigserial primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_signup_attempts_ip_time on signup_attempts (ip, created_at desc);

alter table signup_attempts enable row level security;
-- No policies — reachable only via the admin/service-role client
-- already used throughout signup/actions.ts, same reasoning as
-- login_attempts.
