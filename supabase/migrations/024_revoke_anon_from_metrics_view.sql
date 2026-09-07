-- ============================================================
-- 024_revoke_anon_from_metrics_view.sql
--
-- Defense-in-depth attempt on top of 023's security_invoker fix: revoke
-- the bare SELECT grant from anon too, so RLS isn't the only thing
-- standing between anon and this view.
--
-- Note for future reference: in this project, this revoke does not
-- reliably stick — has_table_privilege('anon', ...) still reports true
-- after running it (the same behavior seen earlier with
-- current_org_id()/current_role_name() before those were fixed by
-- revoking from PUBLIC specifically rather than anon). Revoking SELECT
-- from PUBLIC on a *view* does not appear to survive the same way it
-- does for functions in this environment — something in Supabase's
-- platform-level schema exposure keeps reasserting baseline grants for
-- the auto-exposed public schema.
--
-- This is NOT a live vulnerability: 023's security_invoker=true is the
-- real, verified protection (RLS on organizations/onboarding_assessments
-- correctly filters anon and unrelated authenticated users down to zero
-- rows — confirmed directly with `set role anon` / `set role
-- authenticated` and counting rows, not just by checking grants). This
-- migration is kept for the record and because it's harmless, not
-- because it's confirmed effective.
-- ============================================================

revoke select on platform_business_metrics from public;
grant select on platform_business_metrics to authenticated;
