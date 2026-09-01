-- ============================================================
-- 015_auth_screen_redesign.sql
--
-- Two small additive columns for the new auth-screen visual design:
--
--   profiles.phone            — collected on the Owner's first-login
--                                "Onboarding" screen (accept-invite,
--                                onboarding variant). Nullable — nothing
--                                existing required it before.
--   organizations.login_background_path
--                                — the "Organization login background
--                                image" slot on the split-screen auth
--                                cover. A private-bucket storage path
--                                (like the KYC photos), signed server-
--                                side when rendering — same reasoning as
--                                Ghana Card photos: never a public URL
--                                a hot-linker could scrape.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

alter table profiles add column if not exists phone text;

alter table organizations add column if not exists login_background_path text;

insert into storage.buckets (id, name, public)
values ('org-branding', 'org-branding', false)
on conflict (id) do nothing;
