"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlatformSettings } from "@/lib/platform-settings";

const SPLASH_MS = 1400;
const IMAGE_ROTATE_MS = 1200;

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
  const [imageIndex, setImageIndex] = useState(0);
  const images = (platform.coverImages ?? []).filter(Boolean);
  const brandName = "SEWSINESS";

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setStage("choose"), SPLASH_MS);
    return () => window.clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % images.length);
    }, IMAGE_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [images.length]);

  if (stage === "form") return <>{children}</>;

  return (
    <main
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-indigo"
      aria-label={stage === "loading" ? "SEWSINESS loading" : "Log in or create a business account"}
    >
      {images.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${src}-${index}`}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: index === imageIndex ? 1 : 0 }}
        />
      ))}

      <div
        className="absolute inset-0"
        style={{
          background: images.length
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

        {images.length > 1 && (
          <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
            {images.map((_, index) => (
              <span
                key={index}
                className="h-1.5 rounded-full bg-white/40 transition-all duration-500"
                style={{ width: index === imageIndex ? 22 : 6, opacity: index === imageIndex ? 1 : 0.5 }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
