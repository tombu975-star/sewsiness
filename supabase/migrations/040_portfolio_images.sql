-- ============================================================
-- 040_portfolio_images.sql
--
-- Wires up the photo upload that portfolio_items (004) never got —
-- the "Add Portfolio Piece" form has been text-only ("Photo upload
-- isn't wired up yet") since it shipped.
--
--   portfolio_items.image_url — nullable, so existing text-only
--                                pieces keep rendering fine.
--
--   portfolio-images          — public bucket (portfolio pieces are
--                                meant to be shown off, like avatars,
--                                not sensitive like kyc-documents/
--                                training-evidence). Uploaded straight
--                                from the browser, so it needs a real
--                                storage RLS policy.
--
-- Path scheme is "{organization_id}/{filename}", not "{uid}/..." like
-- avatars — unlike an avatar, a portfolio piece can be added by an
-- Owner/Manager/Trainer on behalf of an apprentice (see new/page.tsx's
-- apprentice picker), so the write boundary that actually matches the
-- table's own RLS ("org members can write portfolio items") is the
-- organization, not the uploading user.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

alter table portfolio_items add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do update set public = true;

drop policy if exists "anyone can view portfolio images" on storage.objects;
create policy "anyone can view portfolio images" on storage.objects
  for select using (bucket_id = 'portfolio-images');

drop policy if exists "org members can upload portfolio images" on storage.objects;
create policy "org members can upload portfolio images" on storage.objects
  for insert with check (
    bucket_id = 'portfolio-images'
    and (storage.foldername(name))[1] = current_org_id()::text
  );

drop policy if exists "org members can replace portfolio images" on storage.objects;
create policy "org members can replace portfolio images" on storage.objects
  for update using (
    bucket_id = 'portfolio-images'
    and (storage.foldername(name))[1] = current_org_id()::text
  );

drop policy if exists "org members can delete portfolio images" on storage.objects;
create policy "org members can delete portfolio images" on storage.objects
  for delete using (
    bucket_id = 'portfolio-images'
    and (storage.foldername(name))[1] = current_org_id()::text
  );
