"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlatformSettings } from "@/lib/platform-settings";

const SPLASH_MS = 1400;
const PHOTO_MS = 2200;
// Ads linger longer than a plain photo — there's a headline (and
// sometimes a caption + link) to actually read, not just a background
// to glance at.
const AD_MS = 4500;

type Slide =
  | { kind: "photo"; key: string; src: string }
  | { kind: "ad"; key: string; src: string; headline: string; caption?: string | null; linkUrl?: string | null };

function DefaultMark() {
  return (
    <svg width="82" height="82" viewBox="-270 -10 520 500" aria-hidden="true">
      <path
        d="M-160 250 C-80 80, 95 55, 170 150 C215 208, 180 270, 90 292 C-20 320,-85 365,-52 420 C-25 465, 80 458, 160 385"
        fill="none"
        stroke="#C9A6E8"
        strokeWidth="78"
        strokeLinecap="round"
      />
      <path
        d="M-155 250 C-78 105, 80 82, 150 155 C195 202, 165 245, 92 265"
        fill="none"
        stroke="#FBBF24"
        strokeWidth="28"
        strokeLinecap="round"
      />
      <path d="M-25 205 L145 20" stroke="#FBBF24" strokeWidth="14" strokeLinecap="round" />
    </svg>
  );
}

export function LoginSplash({
  platform,
  children,
}: {
  platform: PlatformSettings;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"loading" | "choose" | "form">("loading");
  const [slideIndex, setSlideIndex] = useState(0);
  const brandName = "SEWSINESS";

  // Photos and ads share one rotation, photos and ads interleaved
  // roughly one-for-one (rather than all photos then all ads) so an ad
  // never has to wait through the entire photo set to get a turn, and a
  // long ad list can't crowd every plain photo out of rotation either.
  const slides = useMemo<Slide[]>(() => {
    const photos: Slide[] = (platform.coverImages ?? [])
      .filter(Boolean)
      .map((src, i) => ({ kind: "photo", key: `photo-${i}`, src }));
    const ads: Slide[] = (platform.ads ?? [])
      .filter((ad) => ad.imageUrl && ad.headline)
      .map((ad) => ({ kind: "ad", key: `ad-${ad.id}`, src: ad.imageUrl, headline: ad.headline, caption: ad.caption, linkUrl: ad.linkUrl }));

    if (photos.length === 0) return ads;
    if (ads.length === 0) return photos;

    const merged: Slide[] = [];
    const max = Math.max(photos.length, ads.length);
    for (let i = 0; i < max; i++) {
      if (photos[i]) merged.push(photos[i]);
      if (ads[i]) merged.push(ads[i]);
    }
    return merged;
  }, [platform.coverImages, platform.ads]);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setStage("choose"), SPLASH_MS);
    return () => window.clearTimeout(splashTimer);
  }, []);

  // A timeout (rescheduled per-slide) rather than one fixed interval —
  // an ad slide needs longer on screen than a plain photo, so the
  // rotation speed has to vary by what's currently showing.
  useEffect(() => {
    if (slides.length <= 1) return;
    const current = slides[slideIndex % slides.length];
    const duration = current?.kind === "ad" ? AD_MS : PHOTO_MS;
    const timer = window.setTimeout(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [slideIndex, slides]);

  if (stage === "form") return <>{children}</>;

  const activeSlide = slides[slideIndex % Math.max(slides.length, 1)];

  return (
    <main
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-indigo"
      aria-label={stage === "loading" ? "SEWSINESS loading" : "Log in or create a business account"}
    >
      {slides.map((slide, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.key}
          src={slide.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: index === slideIndex % slides.length ? 1 : 0 }}
        />
      ))}

      <div
        className="absolute inset-0"
        style={{
          background: slides.length
            ? "linear-gradient(160deg, rgba(45,10,75,.58), rgba(75,24,120,.88))"
            : "linear-gradient(160deg, var(--indigo), var(--indigo2))",
        }}
      />

      <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-gold/10" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/10" />

      <div className="relative z-10 flex w-full max-w-sm lg:max-w-md flex-col items-center px-8 text-center text-white">
        <div className="mb-6 flex h-24 w-24 lg:h-28 lg:w-28 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
          {platform.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={platform.logoUrl}
              alt="SEWSINESS logo"
              className="h-20 w-20 rounded-[22px] object-cover"
            />
          ) : (
            <DefaultMark />
          )}
        </div>

        <div className="font-display text-3xl lg:text-4xl font-extrabold tracking-wide">{brandName}</div>
        <div className="mt-2 text-sm lg:text-base text-white/75">Fashion Business Operating System</div>

        {/* Ad overlay — a compact card so a headline/caption/link never
            covers the brand mark above or the buttons below, and stays
            clearly a supplementary slide rather than the whole screen. */}
        {activeSlide?.kind === "ad" && (
          <a
            key={activeSlide.key}
            href={activeSlide.linkUrl || undefined}
            target={activeSlide.linkUrl ? "_blank" : undefined}
            rel={activeSlide.linkUrl ? "noopener noreferrer" : undefined}
            className={`mt-5 w-full rounded-xl border border-white/20 bg-black/30 backdrop-blur-sm px-4 py-3 text-left transition-transform ${
              activeSlide.linkUrl ? "hover:bg-black/40 active:scale-[0.98] cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/15 rounded px-1.5 py-0.5">
                Sponsored
              </span>
            </div>
            <div className="font-display font-bold text-sm leading-snug">{activeSlide.headline}</div>
            {activeSlide.caption && <div className="mt-0.5 text-xs text-white/70 leading-snug">{activeSlide.caption}</div>}
            {activeSlide.linkUrl && (
              <div className="mt-1.5 text-[11px] font-semibold text-gold">Learn more →</div>
            )}
          </a>
        )}

        {stage === "loading" ? (
          <div className="mt-12 w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-1/2 rounded-full bg-gold animate-login-splash" />
            </div>
            <p className="mt-4 text-xs font-medium text-white/70">Preparing your secure login…</p>
          </div>
        ) : (
          <div className="mt-10 w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setStage("form")}
              className="w-full rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-3 hover:brightness-105 transition"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="w-full rounded-sm border border-white/30 bg-white/10 text-white font-semibold text-sm py-3 hover:bg-white/20 transition"
            >
              Create a business account
            </button>
          </div>
        )}

        {slides.length > 1 && (
          <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
            {slides.map((slide, index) => (
              <span
                key={slide.key}
                className={`h-1.5 rounded-full transition-all duration-500 ${slide.kind === "ad" ? "bg-gold/60" : "bg-white/40"}`}
                style={{ width: index === slideIndex % slides.length ? 22 : 6, opacity: index === slideIndex % slides.length ? 1 : 0.5 }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
