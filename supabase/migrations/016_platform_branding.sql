-- ============================================================
-- 016_platform_branding.sql
--
-- Platform-level branding for the shared auth cover (login, signup,
-- forgot-password, landing "/"). This is distinct from an individual
-- business's own logo/login background (organizations.logo_url,
-- organizations.login_background_path, 015) — those style a single
-- org's branded experience. This table styles the cover for everyone
-- who hasn't signed in yet, and is controlled only by Super Admin
-- (the platform-operations role), matching who is asked to run the
-- business overall on the platform side.
--
--   platform_settings   — singleton row (id is always 1). Holds the
--                          platform logo, an ordered list of rolling
--                          cover images, and the cover headline/sub-
--                          headline copy. Publicly readable (the
--                          login screen renders before anyone is
--                          signed in), writable only by super_admin.
--
--   platform-branding    — public bucket for the logo + cover photos.
--                          Public because this is marketing/brand
--                          artwork meant to be shown pre-auth, not
--                          sensitive documents (unlike kyc-documents,
--                          007). Writes happen via the service-role
--                          client from a Server Action that itself
--                          calls requireRole(["super_admin"]) first —
--                          see src/app/(app)/settings/actions.ts — so
--                          no anon/authenticated storage policy is
--                          added for it, same reasoning as 007.
--
--   avatars               — public bucket for personal profile photos.
--                          Every signed-in person manages only their
--                          own file, so (unlike platform-branding)
--                          this DOES get a real storage RLS policy
--                          scoped to auth.uid(), since the upload
--                          happens straight from the browser.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists platform_settings (
  id int primary key default 1,
  logo_url text,
  cover_images jsonb not null default '[]'::jsonb,
  cover_headline text not null default 'The Fashion Business OS for Ghanaian tailoring ateliers.',
  cover_subheadline text not null default 'Customers, orders, production, payments, and your whole team — Owner down to Apprentice — in one place, built around how an atelier actually runs.',
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null,
  constraint platform_settings_singleton check (id = 1)
);

insert into platform_settings (id) values (1) on conflict (id) do nothing;

alter table platform_settings enable row level security;

-- Everyone — including anon, pre-login — can read it; the auth cover
-- needs it before there's any session at all.
drop policy if exists "anyone can read platform settings" on platform_settings;
create policy "anyone can read platform settings" on platform_settings
  for select using (true);

-- Only Super Admin can change it. (Writes in practice go through the
-- service-role client so this is belt-and-braces, not load-bearing —
-- but it keeps the table honest if anything ever calls it directly.)
drop policy if exists "super admin can update platform settings" on platform_settings;
create policy "super admin can update platform settings" on platform_settings
  for update using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');

insert into storage.buckets (id, name, public)
values ('platform-branding', 'platform-branding', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Avatars: a signed-in person may upload/replace/remove only files
-- under their own uid prefix ("{uid}/...."), and anyone may view (the
-- bucket is public, so this mostly governs writes).
drop policy if exists "anyone can view avatars" on storage.objects;
create policy "anyone can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "users can upload their own avatar" on storage.objects;
create policy "users can upload their own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can replace their own avatar" on storage.objects;
create policy "users can replace their own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can delete their own avatar" on storage.objects;
create policy "users can delete their own avatar" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- profiles.avatar_url already exists on the base schema (referenced by
-- src/lib/types.ts); this is just a safety net if this migration ever
-- runs against a database created before that.
alter table profiles add column if not exists avatar_url text;
