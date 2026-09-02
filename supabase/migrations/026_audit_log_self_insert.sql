-- ============================================================
-- 026_audit_log_self_insert.sql
--
-- audit_logs previously had a SELECT policy for org members
-- ("org members can read own org audit logs", 003) but no INSERT
-- policy at all — every existing writer used the service-role client
-- (signup/actions.ts, various admin actions), which bypasses RLS.
--
-- src/app/(app)/audit/actions.ts's new logSignOut() needs to insert a
-- row using the ordinary session-bound server client (there's no
-- service-role client available client-side, and this fires from a
-- signed-in user's own session right before they sign out) — so it
-- needs a real INSERT policy, not another service-role write path.
--
-- Scoped tightly: a signed-in user may only insert a row attributing
-- the action to themselves (actor_id = auth.uid()) inside their own
-- organization. They can never write a row claiming to be someone
-- else, or attach it to a different business's audit trail — same
-- authenticity guarantee as if this went through a service-role path,
-- just enforced at the RLS layer instead.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

drop policy if exists "org members can log their own actions" on audit_logs;
create policy "org members can log their own actions" on audit_logs
  for insert with check (
    organization_id = current_org_id()
    and actor_id = auth.uid()
  );
