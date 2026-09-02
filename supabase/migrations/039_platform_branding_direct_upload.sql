-- ============================================================
-- 039_platform_branding_direct_upload.sql
--
-- src/app/(app)/settings/actions.ts's updatePlatformLogo() and
-- addPlatformCoverImage() previously received the image file as part of
-- a Server Action's FormData body, then wrote it to Storage using the
-- service-role client. Same problem as signup's KYC upload (see
-- src/app/signup/actions.ts's MAX_FILE_BYTES comment): Vercel Functions
-- enforce a hard 4.5MB request-body ceiling that no application config
-- can raise. A 6MB single-file limit — reasonable for what's meant to
-- be genuine high-resolution marketing photography for the login
-- screen — would fail outright in production.
--
-- Unlike signup (where no account exists yet, so there's no
-- authenticated session to scope a direct browser upload to), Super
-- Admin is already fully authenticated when managing platform branding.
-- So instead of shrinking the limit and hurting image quality, this
-- takes the same path 016_platform_branding.sql already chose for
-- `avatars`: the browser uploads straight to Supabase Storage (client
-- component, see PlatformBrandingForm.tsx), completely bypassing the
-- Server Action body — which only ever receives the resulting URL
-- string afterward, not the file itself.
--
-- That requires a real storage RLS policy that didn't exist before —
-- 016's own comment explains why one wasn't added originally: "Writes
-- happen via the service-role client from a Server Action that itself
-- calls requireRole(["super_admin"]) first ... so no anon/authenticated
-- storage policy is added for it." That reasoning no longer holds now
-- that the upload itself happens client-side; the role check has to
-- move into the policy instead.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

drop policy if exists "super admin can upload platform branding" on storage.objects;
create policy "super admin can upload platform branding" on storage.objects
  for insert with check (bucket_id = 'platform-branding' and current_role_name() = 'super_admin');

drop policy if exists "super admin can replace platform branding" on storage.objects;
create policy "super admin can replace platform branding" on storage.objects
  for update using (bucket_id = 'platform-branding' and current_role_name() = 'super_admin');

drop policy if exists "super admin can delete platform branding" on storage.objects;
create policy "super admin can delete platform branding" on storage.objects
  for delete using (bucket_id = 'platform-branding' and current_role_name() = 'super_admin');
