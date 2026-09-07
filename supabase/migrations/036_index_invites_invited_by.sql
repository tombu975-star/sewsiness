-- ============================================================
-- 036_index_invites_invited_by.sql
--
-- invites.invited_by (032) shipped without a supporting index — found
-- in this session's routine post-migration FK-index audit. Additive
-- and safe to run against the live database as-is.
-- ============================================================

create index if not exists idx_invites_invited_by on invites(invited_by);
