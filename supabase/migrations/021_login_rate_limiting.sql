-- ============================================================
-- 021_login_rate_limiting.sql
--
-- Login (src/app/login/LoginForm.tsx) calls
-- supabase.auth.signInWithPassword() directly from the browser — it has
-- to, so the session cookie gets set correctly by the Supabase SDK for
-- middleware to read (see src/lib/supabase/client.ts). That means there
-- was no place in this app's own code sitting in front of it to slow
-- down a brute-force attempt; only whatever Supabase's shared,
-- project-wide GoTrue rate limits happen to allow, which aren't tuned
-- to this app and aren't something this migration can configure.
--
-- No Redis/KV is available in this stack, so this is a small
-- Postgres-backed limiter instead: 6 failed attempts for the same email
-- within a rolling 15-minute window blocks further tries against that
-- email until the oldest of those failures ages out. Deliberately keyed
-- by email only (not IP — Next.js on Render doesn't reliably expose the
-- real client IP to a browser-side RPC call, and email-only is the
-- right unit anyway: it protects a given account regardless of which
-- IP is hammering it).
--
-- Both functions are SECURITY DEFINER and called by anon (there's no
-- session yet at login) — so the raw `login_attempts` table itself has
-- RLS enabled with NO policies at all (nobody gets direct table access,
-- not even `authenticated`); the only way in is through these two
-- narrow functions, and neither function's return value differs based
-- on whether the email actually belongs to a real account — that would
-- turn a rate limiter into a user-enumeration oracle.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists login_attempts (
  id bigserial primary key,
  email text not null,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_login_attempts_email_time on login_attempts (lower(email), attempted_at desc);

alter table login_attempts enable row level security;
-- Intentionally no policies — see header. Table is reachable only via
-- the SECURITY DEFINER functions below.

create or replace function record_login_attempt(p_email text, p_success boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into login_attempts (email, success) values (lower(trim(p_email)), p_success);
  -- Self-cleaning: no cron/background job needed. Cheap because it's
  -- scoped to the one email this call already touched, not a full-table
  -- scan, and only runs on the (rare, by definition) failure path.
  if not p_success then
    delete from login_attempts
    where lower(email) = lower(trim(p_email)) and attempted_at < now() - interval '1 day';
  end if;
end;
$$;

-- Returns seconds until the caller may try again (0 = not limited).
create or replace function is_login_rate_limited(p_email text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  max_attempts constant int := 6;
  window_minutes constant int := 15;
  recent_failures int;
  oldest_in_window timestamptz;
begin
  select count(*), min(attempted_at)
    into recent_failures, oldest_in_window
  from login_attempts
  where lower(email) = lower(trim(p_email))
    and success = false
    and attempted_at > now() - (window_minutes || ' minutes')::interval;

  if recent_failures >= max_attempts then
    return greatest(0, ceil(extract(epoch from (
      oldest_in_window + (window_minutes || ' minutes')::interval - now()
    )))::int);
  end if;

  return 0;
end;
$$;

grant execute on function record_login_attempt(text, boolean) to anon, authenticated;
grant execute on function is_login_rate_limited(text) to anon, authenticated;
