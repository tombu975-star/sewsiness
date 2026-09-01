/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },

  async headers() {
    // Applied to every response. Kept conservative — nothing here should
    // break Supabase auth (cookies, redirects), Server Actions, or
    // features the app already relies on; each directive is scoped to
    // what the app actually does, checked against the real code rather
    // than a generic template. Two things worth knowing:
    //
    // 1) `next/font/google` (used in src/app/layout.tsx) self-hosts the
    //    font files at build time — the browser never talks to
    //    fonts.googleapis.com/fonts.gstatic.com at runtime, so neither
    //    needs a CSP allowance.
    //
    // 2) script-src/style-src below use 'unsafe-inline' rather than a
    //    nonce. A nonce-based CSP is stronger against injected-script
    //    XSS, but Next's documented way to do it requires generating a
    //    per-request nonce in middleware and reading headers() in the
    //    root layout — which forces every page in the app to render
    //    dynamically (no static optimization) and needs a real browser
    //    to verify hydration isn't broken, which this sandbox can't do
    //    (see the font-fetch build failures elsewhere in this repo's
    //    history — no outbound network here at all). Shipping that
    //    blind was a worse trade than shipping a real, working CSP now
    //    and flagging the upgrade — so: flagged, not silently claimed.
    const supabaseHost = (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").host;
      } catch {
        return "";
      }
    })();
    const supabaseHttps = supabaseHost ? `https://${supabaseHost}` : "";
    const supabaseWss = supabaseHost ? `wss://${supabaseHost}` : "";

    const csp = [
      "default-src 'self'",
      // 'unsafe-inline' — see comment above. No 'unsafe-eval': this app
      // ships no code that needs it.
      "script-src 'self' 'unsafe-inline'",
      // Tailwind + this app's own extensive use of inline `style={{}}`
      // props (dynamic brand colors, progress bars, etc.) needs this —
      // a nonce/hash approach here has the same dynamic-rendering
      // trade-off as script-src above.
      "style-src 'self' 'unsafe-inline'",
      // blob: — signup's Ghana Card/selfie capture (SignupForm.tsx)
      // previews files via URL.createObjectURL before upload. data: —
      // harmless, common for small inline assets. The Supabase host —
      // avatars, platform branding, and KYC signed URLs are all served
      // from Storage on the same project domain.
      `img-src 'self' data: blob: ${supabaseHttps}`.trim(),
      "font-src 'self' data:",
      // The Supabase host, both https (REST/Auth/Storage) and wss
      // (Realtime/session-sync) — not currently used for live
      // subscriptions in this app, but supabase-js's client can open
      // one internally, so it's included rather than have that fail
      // silently later.
      `connect-src 'self' ${supabaseHttps} ${supabaseWss}`.trim(),
      // Belt-and-braces alongside X-Frame-Options above.
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    const securityHeaders = [
      // Clickjacking: this app is never meant to be framed by another
      // site (it handles login + real business data).
      { key: "X-Frame-Options", value: "DENY" },
      // Stop browsers guessing content-types on uploaded files (KYC
      // images, platform branding) served back out of Storage.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Don't leak the full URL (which can contain IDs) to third-party
      // destinations when a link is clicked; same-origin is fine.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // camera=(self) — NOT camera=(), because src/app/signup/
      // SignupForm.tsx uses getUserMedia() for the mandatory Ghana
      // Card/selfie KYC capture step. Denying camera outright would
      // silently break signup. Everything else the app genuinely
      // doesn't use.
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
      // Legacy XSS filter header — modern browsers ignore it, but costs
      // nothing and some scanners still check for it.
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Content-Security-Policy", value: csp },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // HSTS only makes sense once you're actually being served over
        // HTTPS in production (Render terminates TLS in front of this
        // app) — sending it in local dev over http:// would be wrong,
        // so it's split out and only added outside development.
        source: "/:path*",
        headers:
          process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : [],
      },
    ];
  },
};

export default nextConfig;
