import { createClient } from "@/lib/supabase/server";

export interface PlatformAd {
  id: string;
  imageUrl: string;
  headline: string;
  caption?: string | null;
  linkUrl?: string | null;
}

export interface PlatformSettings {
  logoUrl: string | null;
  coverImages: string[];
  /** Single, non-rotating background for the login screen only — see note below. */
  loginCoverImage: string | null;
  coverHeadline: string;
  coverSubheadline: string;
  /** Promotional slides mixed into the /login splash's rotation — see LoginSplash.tsx. */
  ads: PlatformAd[];
}

// Bundled default cover set — ships with the app so the auth screens look
// finished out of the box, with zero Supabase configuration required.
// Super Admin can still override all of this from Settings → Platform
// Branding (016_platform_branding.sql); anything uploaded there replaces
// this list entirely. Order matters: DEFAULT_COVER_IMAGES[0] doubles as
// the default login background (see loginCoverImage below), so the most
// on-brand, least text-competing image goes first.
const DEFAULT_COVER_IMAGES = [
  "/images/marketing/cover-1-atelier-review.jpg",
  "/images/marketing/cover-5-manager-desk.jpg",
  "/images/marketing/cover-2-boutique-catalog.jpg",
  "/images/marketing/cover-3-workspace.jpg",
  "/images/marketing/cover-4-owner-portrait.jpg",
];

const FALLBACK: PlatformSettings = {
  logoUrl: null,
  coverImages: DEFAULT_COVER_IMAGES,
  loginCoverImage: DEFAULT_COVER_IMAGES[0],
  coverHeadline: "The Fashion Business OS for Ghanaian tailoring ateliers.",
  coverSubheadline:
    "Customers, orders, production, payments, and your whole team — Owner down to Apprentice — in one place, built around how an atelier actually runs.",
  // Ships with a couple of self-referential sample slides — same
  // reasoning as DEFAULT_COVER_IMAGES above: without these, the /login
  // splash's ad rotation (see LoginSplash.tsx) has nothing to show and
  // looks identical to plain image rotation until a Super Admin visits
  // Settings → Platform Branding and adds a real one. These use fixed
  // ids so a Super Admin who later edits/removes them via that screen
  // overwrites this fallback outright (any row in `platform_settings`
  // — even one with `advertisements: []` on purpose — always wins over
  // this file; see the `!data` check below).
  ads: [
    {
      id: "sample-referral",
      imageUrl: DEFAULT_COVER_IMAGES[2],
      headline: "Refer a fellow atelier, earn a month free.",
      caption: "Ask your Sewsiness rep for your referral link.",
      linkUrl: null,
    },
    {
      id: "sample-collections",
      imageUrl: DEFAULT_COVER_IMAGES[4],
      headline: "New: organize custom orders into seasonal Collections.",
      caption: "Look for the NEW tag under Dressmaking in your sidebar.",
      linkUrl: null,
    },
  ],
};

function parseAds(raw: unknown): PlatformAd[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      id: typeof v.id === "string" ? v.id : "",
      imageUrl: typeof v.image_url === "string" ? v.image_url : "",
      headline: typeof v.headline === "string" ? v.headline : "",
      caption: typeof v.caption === "string" ? v.caption : null,
      linkUrl: typeof v.link_url === "string" ? v.link_url : null,
    }))
    .filter((ad) => ad.id && ad.imageUrl && ad.headline);
}

// Reads the single, platform-wide branding row (016_platform_branding.sql).
// Publicly readable by RLS, so this is safe to call from pre-auth pages
// (login, signup, forgot-password, the "/" landing chooser) as well as
// from the Platform Branding settings tab. Never throws — a missing
// migration or empty table just falls back to the built-in cover, so a
// DB hiccup never breaks the sign-in screen itself.
//
// Landing ("/") shows the full rotating `coverImages` set; the actual
// login FORM (LoginForm's AuthCover, once the splash is dismissed) uses
// only `loginCoverImage` — a single, static photo rather than a
// rotating carousel, so the sign-in moment itself feels calm and
// deliberate. The /login SPLASH screen shown first (LoginSplash.tsx),
// by contrast, rolls through the full `coverImages` set plus `ads` —
// it's the one screen on this app explicitly meant to be promotional.
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("platform_settings")
      .select("logo_url, cover_images, cover_headline, cover_subheadline, advertisements")
      .eq("id", 1)
      .single();

    if (!data) return FALLBACK;

    const configuredImages = Array.isArray((data as any).cover_images)
      ? ((data as any).cover_images as unknown[]).filter((v): v is string => typeof v === "string")
      : [];
    const images = configuredImages.length > 0 ? configuredImages : DEFAULT_COVER_IMAGES;

    return {
      logoUrl: (data as any).logo_url ?? null,
      coverImages: images,
      loginCoverImage: images[0],
      coverHeadline: (data as any).cover_headline || FALLBACK.coverHeadline,
      coverSubheadline: (data as any).cover_subheadline || FALLBACK.coverSubheadline,
      ads: parseAds((data as any).advertisements),
    };
  } catch {
    return FALLBACK;
  }
}
