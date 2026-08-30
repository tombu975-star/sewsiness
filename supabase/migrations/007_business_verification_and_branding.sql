-- ============================================================
-- 007_business_verification_and_branding.sql
--
-- Two things:
--   1. A business's own logo (shown on its branded /login/{slug} cover
--      and in-app sidebar).
--   2. Identity verification for self-service business signup: Ghana
--      Card details + a selfie, reviewed and approved/rejected by Super
--      Admin before the business can actually use the app. Businesses
--      enrolled directly by Super Admin (the existing /admin/new flow)
--      skip this — that flow *is* the verification, Super Admin is
--      creating the account themselves.
--
-- "Facial verification" here means: the applicant captures a live
-- selfie (not an uploaded photo — see the front-end capture flow) and
-- a human (Super Admin) visually compares it to the Ghana Card photo
-- before approving. This is NOT automated biometric face-matching —
-- doing that for real means integrating a liveness/face-match provider
-- (e.g. Smile Identity, which has Ghana Card-specific verification),
-- which needs real API credentials this project doesn't have. Swap the
-- manual review step in src/app/(app)/admin/[id]/page.tsx for an API
-- call when you have one; the data model here (selfie_url alongside
-- the ID) already fits that upgrade path without a schema change.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

alter table organizations add column if not exists logo_url text;

alter table organizations add column if not exists verification_status text not null default 'verified'
  check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));
-- Existing rows (and anything Super Admin enrolls from here on via /admin/new)
-- default to 'verified' — that enrollment path IS the verification. Only the
-- new self-service /signup flow ever inserts a row starting at 'pending'.

alter table organizations add column if not exists ghana_card_number text;
alter table organizations add column if not exists ghana_card_front_path text;
alter table organizations add column if not exists ghana_card_back_path text;
alter table organizations add column if not exists selfie_path text;
alter table organizations add column if not exists verification_submitted_at timestamptz;
alter table organizations add column if not exists verification_reviewed_at timestamptz;
alter table organizations add column if not exists verification_reviewed_by uuid references profiles(id) on delete set null;
alter table organizations add column if not exists verification_rejection_reason text;

-- The *_path columns above are storage paths, not public URLs — the
-- kyc-documents bucket below is private. Super Admin views them via a
-- short-lived signed URL generated server-side (service-role client),
-- never a direct public link.

-- Private bucket for Ghana Card photos + verification selfies. Only the
-- service-role client (src/lib/supabase/admin.ts) ever reads or writes
-- here — no anon/authenticated storage policy is needed or added,
-- since default Storage RLS already denies both by default on a
-- private bucket, and service-role bypasses RLS entirely by design.
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;
