import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { Button } from "@/components/Button";

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    redirect(homePathForRole((profile?.role as Role) ?? "staff"));
  }

  return (
    <main className="min-h-screen bg-[#F2EEFB] text-[#1E1240]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <section
          className="relative flex-1 overflow-hidden rounded-[30px] shadow-[0_30px_60px_rgba(76,29,149,0.28)]"
          style={{ background: "linear-gradient(165deg, #3B1370 0%, #5B21B6 55%, #7C3AED 100%)" }}
        >
          {/* Soft glow accents — mirrors the mockup's plain gradient
              splash (screen 1) rather than a photo background, so this
              reads as a brand moment first, product screenshot second. */}
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-[#A78BFA]/25 blur-3xl" />

          <div className="relative z-10 flex items-center gap-2.5 p-4 sm:p-6 lg:p-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white ring-1 ring-white/25">✂</div>
            <span className="font-display text-base font-semibold tracking-wide text-white drop-shadow-sm">SEWSINESS</span>
          </div>

          <div className="relative z-10 flex min-h-[620px] items-center p-4 sm:p-6 lg:p-10">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-[#C4B5FD]" />
                Custom Tailoring Made Simple
              </div>

              <h1 className="max-w-md text-4xl font-black leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.75rem]">
                Build a modern atelier business.
              </h1>

              <p className="mt-4 max-w-md text-base leading-7 text-white/80 sm:text-lg">
                Manage production, orders, staff, customer fitting, quality control, and business growth from one polished platform built for tailoring brands.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button href="/signup" variant="primary" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#5B21B6] shadow-[0_12px_24px_rgba(0,0,0,0.18)] hover:bg-white/90">
                  Get started →
                </Button>
                <Button href="/login" variant="outline" className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15">
                  I already have an account
                </Button>
              </div>

              {/* Mirrors the mockup's icon-badge feature row (screen 2:
                  Quality Workmanship / On-Time Delivery / Easy Tracking),
                  swapped for what this app actually does. */}
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
                {[
                  { icon: "◈", label: "Full Workflow" },
                  { icon: "◔", label: "Live Tracking" },
                  { icon: "₵", label: "Secure Payments" },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col items-center text-center gap-1.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-lg text-white ring-1 ring-white/20">{f.icon}</span>
                    <span className="text-xs font-medium text-white/85 leading-tight">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Everything above is the Owner/staff pitch — signup + login
                  for the operations dashboard. This is the separate entry
                  point into the customer-facing storefront (browse tailors,
                  customize a garment, place an order), which needs no login
                  at all — see PUBLIC_PATHS's "/shop" allowlist in
                  middleware.ts. Kept visually secondary (a plain link, not
                  a button) so it doesn't compete with the primary Owner CTA
                  above it. */}
              <p className="mt-7 text-sm text-white/75">
                Looking to order tailor-made clothing instead?{" "}
                <a href="/shop/welcome" className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white">
                  Browse as a customer →
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
