import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { Button } from "@/components/Button";
import { getPlatformSettings } from "@/lib/platform-settings";

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

  const platform = await getPlatformSettings();
  const heroImage = platform.coverImages[0] ?? "/images/marketing/cover-1-atelier-review.jpg";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f3f0_0%,_#efe9e4_30%,_#d8d0cc_100%)] px-4 py-6 text-[#171a2d] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between rounded-full border border-white/30 bg-white/45 px-4 py-3 shadow-[0_12px_30px_rgba(22,19,29,0.06)] backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e2340] text-sm font-bold text-[#f7d879] shadow-sm">S</div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b6177]">Sewsiness</div>
              <div className="text-sm font-semibold text-[#171a2d]">Fashion Business OS</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#2a2d3d] md:flex">
            <Link href="/login" className="transition hover:text-[#1e2340]">Log in</Link>
            <Link href="/signup" className="transition hover:text-[#1e2340]">Create account</Link>
          </nav>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e7ddcf] bg-[#fffaf5]/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f4c32] shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-[#d5ab4d]" />
              Built for tailored businesses
            </div>

            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.06em] text-[#151a2f] sm:text-5xl lg:text-[4rem]">
              Run your atelier with clarity and confidence.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#4f586f] sm:text-lg">
              Manage your production, customer orders, staff workflow, and tailoring operations from one polished platform designed for modern fashion businesses.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/signup" variant="primary" className="rounded-full bg-[#f0c34d] px-6 py-3 text-sm font-semibold text-[#171a2d] shadow-[0_12px_24px_rgba(240,195,77,0.28)] hover:bg-[#f4cd66]">
                Get started
              </Button>
              <Button href="/login" variant="outline" className="rounded-full border border-[#dfe1e8] bg-white/75 px-6 py-3 text-sm font-semibold text-[#1b1e2f] hover:bg-white">
                Log in
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[#5b6177]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e8e0d7] bg-white/55 px-3 py-1.5">
                <span className="text-[#1d2d64]">✓</span> Business operations
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e8e0d7] bg-white/55 px-3 py-1.5">
                <span className="text-[#1d2d64]">✓</span> Tailor workflows
              </span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px]">
              <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-[#f0c34d]/25 blur-2xl" />
              <div className="absolute -right-4 bottom-8 h-28 w-28 rounded-full bg-[#8fa4ff]/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-[#f4f0ed] shadow-[0_22px_44px_rgba(20,18,22,0.12)]">
                <div className="relative h-[520px] overflow-hidden">
                  <Image src={heroImage} alt="Tailor working at a sewing machine" fill className="object-cover" sizes="420px" priority />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/10 via-[#000000]/10 to-[#000000]/55" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-[18px]">
                  <div className="rounded-[26px] border border-white/15 bg-[#f4f1f0]/15 p-[16px] backdrop-blur-[2px]">
                    <div className="mb-[10px] flex items-center justify-between text-[10px] font-medium text-white/85">
                      <span>Tailor-made clothing</span>
                      <span className="rounded-full border border-white/25 bg-white/10 px-[8px] py-[3px] leading-none">New</span>
                    </div>
                    <h2 className="mb-[8px] text-[18px] font-bold leading-[1.1] text-white">Tailor-made clothing</h2>
                    <p className="mb-[14px] text-[12px] leading-[1.5] text-white/85">
                      Tailor-made clothing offers unmatched comfort, style, and precision.
                    </p>
                    <Button href="/signup" variant="primary" className="w-full rounded-full bg-[#f0c34d] px-3 py-[10px] text-[12px] font-semibold text-[#1b1c2a] hover:bg-[#f4ca62]">
                      Get started
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-10 flex max-w-[820px] flex-col items-center justify-center gap-[8px] text-center text-[#1d1f2c]">
          <div className="flex items-center gap-[14px] text-[15px] font-medium text-[#2e3559]">
            <Link href="/login" className="hover:underline underline-offset-4">
              Log in
            </Link>
            <span className="text-[#8b8f9b]">|</span>
            <Link href="/signup" className="hover:underline underline-offset-4">
              Create a business account
            </Link>
          </div>
          <div className="flex items-center justify-center gap-[14px] text-[12px] font-medium text-[#575d6b]">
            <Link href="/open-account" className="hover:underline">
              Open an Account
            </Link>
            <span>|</span>
            <Link href="/forgot-account" className="hover:underline">
              Forgot account number?
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
