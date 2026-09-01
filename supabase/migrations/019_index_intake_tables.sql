-- ============================================================
-- 019_index_intake_tables.sql
--
-- Foreign-key indexes on tables added by 016-018 that shipped without
-- them. Additive and safe to run against the live database as-is.
-- ============================================================

create index if not exists idx_account_requests_resolved_by on account_requests(resolved_by);
create index if not exists idx_account_recovery_requests_resolved_by on account_recovery_requests(resolved_by);
create index if not exists idx_account_recovery_requests_matched_org_id on account_recovery_requests(matched_organization_id);
create index if not exists idx_account_recovery_requests_matched_profile_id on account_recovery_requests(matched_profile_id);
create index if not exists idx_onboarding_assessments_submitted_by on onboarding_assessments(submitted_by);
create index if not exists idx_platform_settings_updated_by on platform_settings(updated_by);
