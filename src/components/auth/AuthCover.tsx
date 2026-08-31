"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Shared cover for every auth page (login, signup, forgot/reset password,
// and the landing chooser at "/"). Split-screen from the tablet breakpoint
// up (md: 768px) through laptop/desktop; below that it becomes a photo
// hero with a curved transition into a brand-color panel — the same
// pattern used by mobile-banking apps (image → curve → colored panel with
// logo badge + copy → a floating card for the actual form).
//
// Both layouts can show a rolling set of images decided by Super Admin
// (Settings → Platform Branding) and a platform logo in place of the
// default mark. Neither is required — with no images configured this
// falls back to the original solid gradient, and with no logo it falls
// back to the default SEWSINESS mark.
//
// The left panel (desktop) / hero (mobile) also doubles as navigation —
// its two buttons are how "clicking the cover" gets you to /login or
// /signup from anywhere in the auth flow, not just from a landing page.

const ROTATE_MS = 6000;

function useRotatingIndex(length: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % length), ROTATE_MS);
    return () => clearInterval(id);
  }, [length]);
  return index;
}

function RotatingImages({ images, index, overlay }: { images: string[]; index: number; overlay: string }) {
  return (
    <div className="absolute inset-0">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + i}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 pointer-events-none" style={{ background: overlay }} />
    </div>
  );
}

function CoverDots({ count, index }: { count: number; index: number }) {
  if (count <= 1) return null;
  return (
    <div className="relative flex items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: i === index ? 18 : 6,
            background: i === index ? "var(--gold)" : "rgba(255,255,255,.35)",
          }}
        />
      ))}
    </div>
  );
}

function DefaultMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-270 -10 520 500" className="shrink-0">
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

function LogoMark({ logoUrl, brandName, size = 40 }: { logoUrl?: string | null; brandName: string; size?: number }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${brandName} logo`}
        style={{ width: size, height: size }}
        className="rounded-lg object-cover bg-white/10 shrink-0"
      />
    );
  }
  return <DefaultMark size={size} />;
}

export function AuthCover({
  mode,
  logoUrl,
  businessName,
  coverImages,
  headline,
  subheadline,
  children,
}: {
  mode: "login" | "signup" | "forgot" | "reset" | "landing";
  logoUrl?: string | null;
  businessName?: string | null;
  coverImages?: string[];
  headline?: string;
  subheadline?: string;
  children: React.ReactNode;
}) {
  const brandName = businessName || "SEWSINESS";
  const tagline = businessName
    ? "Sign in to your workspace."
    : headline || "The Fashion Business OS for Ghanaian tailoring ateliers.";
  const desc =
    subheadline ||
    "Customers, orders, production, payments, and your whole team — Owner down to Apprentice — in one place, built around how an atelier actually runs.";

  const images = (coverImages ?? []).filter(Boolean);
  const hasImages = images.length > 0;
  const index = useRotatingIndex(images.length);

  const navButtons = (compact: boolean) => (
    <div className="relative flex items-center gap-2">
      <Link
        href="/login"
        className={`rounded-lg font-semibold transition-colors ${compact ? "text-xs px-3.5 py-2" : "text-sm px-4 py-2.5"} ${
          mode === "login" ? "bg-gold text-[#3a2400]" : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
        }`}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className={`rounded-lg font-semibold transition-colors ${compact ? "text-xs px-3.5 py-2" : "text-sm px-4 py-2.5"} ${
          mode === "signup" ? "bg-gold text-[#3a2400]" : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
        }`}
      >
        Create a business account
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-2 bg-canvas">
      {/* ---------------- Desktop / tablet — split screen, md (768px) up ---------------- */}
      <div
        className="relative hidden md:flex flex-col justify-between px-10 lg:px-14 py-12 text-white overflow-hidden"
        style={!hasImages ? { background: "linear-gradient(160deg, var(--indigo), var(--indigo2))" } : undefined}
      >
        {hasImages ? (
          <RotatingImages
            images={images}
            index={index}
            overlay="linear-gradient(180deg, rgba(24,10,48,.55) 0%, rgba(24,10,48,.45) 45%, rgba(24,10,48,.82) 100%)"
          />
        ) : (
          <>
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none" style={{ background: "rgba(251,191,36,.16)" }} />
            <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(251,191,36,.10)" }} />
          </>
        )}

        <Link href="/" className="relative flex items-center gap-3">
          <LogoMark logoUrl={logoUrl} brandName={brandName} size={40} />
          <span className="font-display font-extrabold text-xl tracking-wide drop-shadow-sm">{brandName}</span>
        </Link>

        <div className="relative">
          <h1 className="font-display font-extrabold text-3xl lg:text-4xl leading-tight mb-3 drop-shadow-sm">{tagline}</h1>
          {!businessName && (
            <p className="text-sm max-w-sm" style={{ color: "#E7DFF7" }}>
              {desc}
            </p>
          )}
          {hasImages && <div className="mt-5"><CoverDots count={images.length} index={index} /></div>}
        </div>

        {navButtons(false)}
      </div>

      {/* ---------------- Mobile — photo hero, curved transition, floating form card ---------------- */}
      <div className="md:hidden">
        <div className="relative overflow-hidden" style={{ height: hasImages ? "clamp(260px, 42vh, 380px)" : undefined }}>
          <div
            className="relative overflow-hidden px-6 pt-8"
            style={{
              height: hasImages ? "100%" : undefined,
              paddingBottom: hasImages ? 56 : 32,
              background: hasImages ? undefined : "linear-gradient(160deg, var(--indigo), var(--indigo2))",
            }}
          >
            {hasImages ? (
              <RotatingImages
                images={images}
                index={index}
                overlay="linear-gradient(190deg, rgba(24,10,48,.15) 0%, rgba(24,10,48,.05) 40%, rgba(24,10,48,.6) 100%)"
              />
            ) : (
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(251,191,36,.18)" }} />
            )}

            <Link href="/" className="relative inline-flex items-center gap-2">
              <LogoMark logoUrl={logoUrl} brandName={brandName} size={30} />
              <span className="font-display font-bold text-base tracking-wide text-white drop-shadow">{brandName}</span>
            </Link>
          </div>

          {/* Curved divider — image (or gradient) above, indigo panel below */}
          <svg
            className="absolute left-0 right-0 w-full"
            style={{ bottom: -1, height: 46 }}
            viewBox="0 0 400 46"
            preserveAspectRatio="none"
          >
            <path d="M0,26 C90,4 150,44 260,22 C320,10 360,26 400,14 L400,46 L0,46 Z" fill="var(--indigo)" />
          </svg>
        </div>

        {/* Brand-color panel: headline/tagline + logo badge overlapping the curve */}
        <div className="relative px-6 pt-9 pb-9 text-white" style={{ background: "linear-gradient(160deg, var(--indigo), var(--indigo2))" }}>
          <div
            className="absolute -top-7 right-6 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ring-4"
            style={{ background: "linear-gradient(160deg, var(--indigo2), var(--indigo))", ["--tw-ring-color" as any]: "var(--canvas)" }}
          >
            <LogoMark logoUrl={logoUrl} brandName={brandName} size={30} />
          </div>

          <h1 className="font-display font-extrabold text-2xl leading-snug mb-2 max-w-[85%] drop-shadow-sm">{tagline}</h1>
          {!businessName && <p className="text-[13px] leading-relaxed max-w-[92%]" style={{ color: "#E7DFF7" }}>{desc}</p>}

          {hasImages && (
            <div className="mt-5">
              <CoverDots count={images.length} index={index} />
            </div>
          )}

          <div className="mt-6">{navButtons(true)}</div>
        </div>
      </div>

      {/* ---------------- Right panel / page content — the actual form ---------------- */}
      <div className="flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
