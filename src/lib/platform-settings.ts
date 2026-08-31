import { createClient } from "@/lib/supabase/server";

export interface PlatformSettings {
  logoUrl: string | null;
  coverImages: string[];
  coverHeadline: string;
  coverSubheadline: string;
}

const FALLBACK: PlatformSettings = {
  logoUrl: null,
  coverImages: [],
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
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("platform_settings")
      .select("logo_url, cover_images, cover_headline, cover_subheadline")
      .eq("id", 1)
      .single();

    if (!data) return FALLBACK;

    const images = Array.isArray((data as any).cover_images)
      ? ((data as any).cover_images as unknown[]).filter((v): v is string => typeof v === "string")
      : [];

    return {
      logoUrl: (data as any).logo_url ?? null,
      coverImages: images,
      coverHeadline: (data as any).cover_headline || FALLBACK.coverHeadline,
      coverSubheadline: (data as any).cover_subheadline || FALLBACK.coverSubheadline,
    };
  } catch {
    return FALLBACK;
  }
}
