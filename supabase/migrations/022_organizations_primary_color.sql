-- ============================================================
-- 022_organizations_primary_color.sql
--
-- organizations.primary_color already exists on the live database (used
-- by src/app/(app)/settings/actions.ts and settings/page.tsx for the
-- Organization branding color picker), but was never captured in a
-- migration file — schema drift from an ad-hoc change. Documenting it
-- here so a fresh install of this repo actually matches what's live,
-- instead of the Settings page breaking on a brand-new database with
-- "column primary_color does not exist".
--
-- Additive and safe to run against the live database as-is (if_not_exists
-- makes this a no-op where the column is already there, as it is now).
-- ============================================================

alter table organizations add column if not exists primary_color text default '#8a382a';
