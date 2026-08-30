import Link from "next/link";

// Shared split-screen cover for every auth page (login, signup, forgot/reset
// password, and the landing chooser at "/"). Split-screen from the tablet
// breakpoint up (md: 768px) through laptop/desktop; below that it collapses
// to a compact header strip above the form so mobile stays single-column.
//
// The left panel doubles as navigation — its two buttons are how "clicking
// the cover" gets you to /login or /signup from anywhere in the auth flow,
// not just from a dedicated landing page.
export function AuthCover({
  mode,
  logoUrl,
  businessName,
  children,
}: {
  mode: "login" | "signup" | "forgot" | "reset" | "landing";
  logoUrl?: string | null;
  businessName?: string | null;
  children: React.ReactNode;
}) {
  const brandName = businessName || "SEWSINESS";
  const tagline = businessName
    ? "Sign in to your workspace."
    : "The Fashion Business OS for Ghanaian tailoring ateliers.";

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-canvas">
      {/* Left panel — brand cover, split-screen from md (tablet) up */}
      <div
        className="relative hidden md:flex flex-col justify-between px-10 lg:px-14 py-12 text-white overflow-hidden"
        style={{ background: "linear-gradient(160deg, var(--indigo), var(--indigo2))" }}
      >
        <div
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "rgba(251,191,36,.16)" }}
        />
        <div
          className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "rgba(251,191,36,.10)" }}
        />

        <Link href="/" className="relative flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${brandName} logo`} className="w-11 h-11 rounded-lg object-cover bg-white/10" />
          ) : (
            <svg width="40" height="40" viewBox="-270 -10 520 500" className="shrink-0">
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
          )}
          <span className="font-display font-extrabold text-xl tracking-wide">{brandName}</span>
        </Link>

        <div className="relative">
          <h1 className="font-display font-extrabold text-3xl lg:text-4xl leading-tight mb-3">{tagline}</h1>
          {!businessName && (
            <p className="text-sm max-w-sm" style={{ color: "#D8CFEE" }}>
              Customers, orders, production, payments, and your whole team — Owner down to
              Apprentice — in one place, built around how an atelier actually runs.
            </p>
          )}
        </div>

        <div className="relative flex items-center gap-2">
          <Link
            href="/login"
            className={`rounded-lg text-sm font-semibold px-4 py-2.5 transition-colors ${
              mode === "login"
                ? "bg-gold text-[#3a2400]"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
            }`}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={`rounded-lg text-sm font-semibold px-4 py-2.5 transition-colors ${
              mode === "signup"
                ? "bg-gold text-[#3a2400]"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
            }`}
          >
            Create a business account
          </Link>
        </div>
      </div>

      {/* Mobile-only compact header (below md) — same cover, collapsed */}
      <div
        className="md:hidden relative overflow-hidden px-6 pt-10 pb-8 text-center text-white"
        style={{ background: "linear-gradient(160deg, var(--indigo), var(--indigo2))" }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "rgba(251,191,36,.18)" }}
        />
        <Link href="/" className="relative inline-flex flex-col items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${brandName} logo`} className="w-11 h-11 rounded-lg object-cover bg-white/10" />
          ) : (
            <svg width="36" height="36" viewBox="-270 -10 520 500">
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
          )}
          <span className="font-display font-extrabold text-lg tracking-wide">{brandName}</span>
        </Link>
        <div className="relative mt-4 flex items-center justify-center gap-2">
          <Link
            href="/login"
            className={`rounded-lg text-xs font-semibold px-3.5 py-2 transition-colors ${
              mode === "login" ? "bg-gold text-[#3a2400]" : "bg-white/10 text-white border border-white/20"
            }`}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={`rounded-lg text-xs font-semibold px-3.5 py-2 transition-colors ${
              mode === "signup" ? "bg-gold text-[#3a2400]" : "bg-white/10 text-white border border-white/20"
            }`}
          >
            Create a business account
          </Link>
        </div>
      </div>

      {/* Right panel — the actual page content */}
      <div className="flex items-center justify-center px-4 py-10 md:py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
