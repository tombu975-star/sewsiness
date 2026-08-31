import { createClient } from "@/lib/supabase/server";

export interface PlatformSettings {
  logoUrl: string | null;
  coverImages: string[];
  /** Single, non-rotating background for the login screen only — see note below. */
  loginCoverImage: string | null;
  coverHeadline: string;
  coverSubheadline: string;
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
};

// Reads the single, platform-wide branding row (016_platform_branding.sql).
// Publicly readable by RLS, so this is safe to call from pre-auth pages
// (login, signup, forgot-password, the "/" landing chooser) as well as
// from the Platform Branding settings tab. Never throws — a missing
// migration or empty table just falls back to the built-in cover, so a
// DB hiccup never breaks the sign-in screen itself.
//
// Landing ("/") shows the full rotating `coverImages` set; the login
// screen (LoginSplash + LoginForm) uses only `loginCoverImage` — a
// single, static photo rather than a rotating carousel, so the sign-in
// moment feels calm and deliberate rather than promotional. It's always
// the first image of whichever set is active (bundled default, or
// Super Admin's configured set once they've uploaded their own).
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("platform_settings")
      .select("logo_url, cover_images, cover_headline, cover_subheadline")
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
    };
  } catch {
    return FALLBACK;
  }
}
