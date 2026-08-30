-- ============================================================
-- 013_training_evidence_bucket.sql
-- Private storage bucket for apprentice-submitted evidence photos
-- attached to gradable training_tasks (see 012_learning_platform.sql).
-- Only ever read/written via the service-role client — no anon/
-- authenticated storage policy needed, same reasoning as
-- kyc-documents in 007.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('training-evidence', 'training-evidence', false)
on conflict (id) do nothing;
