-- ============================================================
-- 035_seed_sample_advertisements.sql
--
-- 016_platform_branding.sql already seeds one `platform_settings` row
-- (id = 1) the moment that migration runs, and 034 defaulted its new
-- `advertisements` column to an empty array — so on every install that
-- ran both migrations, that row already exists with `advertisements =
-- '[]'`. That means the fallback sample ads added to
-- src/lib/platform-settings.ts's FALLBACK constant never actually run
-- in practice: that fallback only kicks in if the query itself fails
-- (missing migration, DB hiccup), not when it succeeds and returns an
-- empty array — which is exactly what a freshly migrated, never-touched
-- install returns. Without this, the /login splash's ad rotation (see
-- LoginSplash.tsx) has nothing to show until a Super Admin manually
-- visits Settings → Platform Branding and adds one.
--
-- This backfills two starter sample ads into that row, but ONLY where
-- `advertisements` is still exactly '[]' — i.e. only an install that
-- has never touched this field. A Super Admin who deliberately removed
-- every ad they'd added is left alone; there's no way to tell that
-- state apart from "never configured" from the stored value alone, but
-- treating "still at the untouched default" as fair game to backfill,
-- while never overwriting *any* array with content in it, is the
-- narrowest read of that ambiguity. Re-running this migration is safe:
-- once the row has these two ads (or anything else), the `= '[]'`
-- guard means it won't run again.
-- ============================================================

update platform_settings
set advertisements = '[
  {
    "id": "sample-referral",
    "image_url": "/images/marketing/cover-2-boutique-catalog.jpg",
    "headline": "Refer a fellow atelier, earn a month free.",
    "caption": "Ask your Sewsiness rep for your referral link.",
    "link_url": null
  },
  {
    "id": "sample-collections",
    "image_url": "/images/marketing/cover-5-manager-desk.jpg",
    "headline": "New: organize custom orders into seasonal Collections.",
    "caption": "Look for the NEW tag under Dressmaking in your sidebar.",
    "link_url": null
  }
]'::jsonb
where id = 1
  and advertisements = '[]'::jsonb;
