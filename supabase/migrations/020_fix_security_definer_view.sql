-- ============================================================
-- 020_fix_security_definer_view.sql
--
-- First fix for the platform_business_metrics data leak (see 023 for
-- the fuller writeup): views default to running with the view owner's
-- privileges, bypassing RLS on the underlying tables entirely. This
-- ALTER closed it at the time — but a separate ALTER like this does NOT
-- survive a future CREATE OR REPLACE VIEW of the same view, which is
-- exactly what silently undid it later. Kept here as an accurate
-- historical record; 023_reharden_view_permanently.sql is the durable
-- fix (security_invoker baked into the CREATE statement itself) and is
-- what actually matters for a fresh install — running this file alone
-- on a fresh database is fine (idempotent), just not sufficient by
-- itself long-term.
-- ============================================================

alter view platform_business_metrics set (security_invoker = true);
