-- ============================================================
-- 023_reharden_view_permanently.sql
--
-- platform_business_metrics (018) was found, in a live audit, to have
-- regressed back to leaking every verified business's health score,
-- growth trend and priority to anon and any signed-in user regardless
-- of org membership — despite having been fixed once already with a
-- separate `alter view ... set (security_invoker = true)` statement.
--
-- Root cause: security_invoker is NOT preserved across a
-- `CREATE OR REPLACE VIEW` — it silently resets to the default (unsafe,
-- owner-privileged, RLS-bypassing) setting every time the view is
-- redefined, even if an earlier ALTER had set it correctly. Something
-- re-ran 018's CREATE OR REPLACE VIEW (which doesn't specify
-- security_invoker) after the original fix, undoing it without any
-- error or warning.
--
-- The fix this time is baked directly into the CREATE OR REPLACE VIEW
-- statement itself via `WITH (security_invoker = true)`, so any future
-- re-run of *this exact statement* keeps the protection — there's no
-- longer a separate ALTER that a later re-run of 018 (or an accidental
-- redeploy of an older migration ordering) could silently undo.
--
-- Verified directly (not just via grants/reloptions, which turned out to
-- be an unreliable signal in this project — see 024 below): ran this
-- query AS the anon and authenticated roles via `set role`, confirmed
-- zero rows visible to both, and confirmed anon can't even execute the
-- underlying current_org_id() RLS-check function (fails closed, not
-- just empty).
-- ============================================================

create or replace view platform_business_metrics
with (security_invoker = true)
as
with ranked as (
  select
    oa.*,
    row_number() over (partition by oa.organization_id order by oa.version desc) as rn
  from onboarding_assessments oa
  where oa.status = 'submitted'
),
latest as (
  select * from ranked where rn = 1
),
previous as (
  select * from ranked where rn = 2
)
select
  o.id as organization_id,
  o.name as business_name,
  o.region,
  l.overall_score as health_score,
  l.dimension_scores,
  case when p.overall_score is null then null else l.overall_score - p.overall_score end as growth_delta,
  case
    when l.overall_score is null then 'No assessment'
    when p.overall_score is null then 'New'
    when l.overall_score - p.overall_score > 2 then 'Improving'
    when l.overall_score - p.overall_score < -2 then 'Declining'
    else 'Stable'
  end as trend,
  case
    when l.overall_score is null then 'Unknown'
    when l.overall_score < 50 then 'Critical'
    when l.overall_score < 65 then 'Medium'
    else 'Low'
  end as priority,
  l.submitted_at as health_submitted_at
from organizations o
left join latest l on l.organization_id = o.id
left join previous p on p.organization_id = o.id
where o.verification_status = 'verified';

comment on view platform_business_metrics is
  'Privacy-safe, cross-business rollup for Super Admin: health, growth, trend and priority only — never revenue, customers or raw tenant records. security_invoker=true is set IN the view definition (not as a separate ALTER) so it survives any future CREATE OR REPLACE of this view.';
