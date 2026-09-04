-- ============================================================
-- 041_apprentice_training_completion.sql
--
-- Backs two new features: marking an apprentice's training complete,
-- and issuing them a downloadable certificate for it (see
-- src/app/(app)/apprentices/[id]/page.tsx and
-- src/app/(app)/apprentices/[id]/certificate/route.ts).
--
-- No new RLS policy is needed for any of this:
--   - Reads: "org members can read apprentice profiles" (schema.sql)
--     already covers every column added here, including the apprentice
--     reading their own row.
--   - Writes: apprentice_profiles has never had an UPDATE policy at
--     all — only the INSERT policy from 025_role_scoped_writes — so
--     nothing in the normal client could alter it after creation
--     regardless. Marking training complete follows the same pattern
--     every other write here already does (see resendInvite,
--     enrollBusiness): a Server Action using the service-role client,
--     with the authorization check done in application code
--     (requireRole + an explicit trainer-owns-this-apprentice check),
--     not a broad new RLS policy that would need its own column-level
--     restriction to stop a trainer editing fields beyond this one.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

alter table apprentice_profiles add column if not exists completed_at timestamptz;
alter table apprentice_profiles add column if not exists completed_by uuid references profiles(id) on delete set null;
-- Printed on the certificate and usable as a simple, human-shareable
-- verification code — not a security boundary (nothing gates access
-- based on knowing this value), just a reference number.
alter table apprentice_profiles add column if not exists certificate_number text unique;
