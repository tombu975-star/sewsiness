-- ============================================================
-- 011_definer_function_hardening.sql
--
-- Tightens who can call the app's SECURITY DEFINER helper functions.
--
-- NOTE on how this is written: a plain `revoke execute ... from anon`
-- (or `from public`) was NOT durable in this Supabase project — verified
-- directly (revoked, confirmed gone via has_function_privilege, then
-- found re-granted again with zero intervening statements run). Something
-- in this environment re-applies `anon`/`authenticated` grants on
-- public-schema functions after migrations run, most likely a platform
-- reconciliation step for PostgREST's schema cache. Rather than fight
-- that, current_org_id/current_role_name/get_business_directory/
-- get_business_stage_breakdown already defend themselves internally
-- (raise an exception unless current_role_name() = 'super_admin', or —
-- for current_org_id/current_role_name — simply return NULL for a caller
-- with no session, which is harmless). check_api_rate_limit didn't have
-- that same internal guard, so this migration adds one: it checks
-- session_user (the role that actually connected — unlike current_user,
-- unaffected by SECURITY DEFINER) and rejects anything that isn't
-- service_role. Verified directly: `set role anon; select
-- check_api_rate_limit(...)` now raises "not authorized" even though the
-- grant itself is still nominally present.
--
-- prevent_profile_privilege_escalation() and rls_auto_enable() are also
-- flagged by the linter, but both are trigger functions (`returns
-- trigger` / `returns event_trigger`) — Postgres itself refuses to
-- invoke a trigger function directly via a normal call (there's no
-- TriggerData to give it), independent of any grant. That linter warning
-- is a false positive for this specific pair; left as-is on purpose.
--
-- get_certificate_for_verification(code) is INTENTIONALLY callable by
-- anon — it's what powers the public /verify/[code] certificate page.
-- Also left as-is on purpose.
--
-- Safe to run against the live database as-is.
-- ============================================================

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
  if session_user <> 'service_role' then
    raise exception 'not authorized';
  end if;

  select count(*) into recent_count
  from api_request_logs
  where api_key_id = p_api_key_id and requested_at > now() - interval '60 seconds';

  insert into api_request_logs (api_key_id, organization_id, path, method)
  values (p_api_key_id, p_organization_id, p_path, p_method);

  return recent_count < p_limit_per_minute;
end;
$$;
