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
    <main className="min-h-screen bg-[#f4efe8] text-[#171a2d]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-center justify-between rounded-full border border-white/40 bg-white/55 px-4 py-3 shadow-[0_8px_24px_rgba(22,19,29,0.06)] backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1d213c] text-sm font-bold text-[#f0c34d]">S</div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5b6177]">Sewsiness</div>
              <div className="text-sm font-semibold text-[#171a2d]">Fashion Business OS</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-[#2a2d3d]">
            <Link href="/login" className="hover:text-[#171a2d]">Log in</Link>
            <Link href="/signup" className="rounded-full border border-[#dfe1e8] bg-white/80 px-3 py-2 transition hover:bg-white">Create account</Link>
          </div>
        </header>

        <section className="relative flex-1 overflow-hidden rounded-[30px] border border-white/30 bg-[#d8d0ca] shadow-[0_30px_60px_rgba(22,19,29,0.18)]">
          <div className="absolute inset-0">
            <Image src={heroImage} alt="Tailor and client reviewing fabric options" fill className="object-cover" sizes="100vw" priority />
            <div className="absolute inset-0 bg-gradient-to-r from-[#17151b]/80 via-[#17151b]/35 to-[#17151b]/20" />
          </div>

          <div className="relative z-10 flex min-h-[620px] items-end p-4 sm:p-6 lg:p-10">
            <div className="max-w-xl rounded-[28px] border border-white/10 bg-[#f5f1ed]/10 p-5 shadow-[0_20px_40px_rgba(17,14,19,0.18)] backdrop-blur-[2px] sm:p-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f0d9a6] bg-[#f7ebd2]/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b4d21]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#d4a94d]" />
                Tailor-made clothing
              </div>

              <h1 className="max-w-md text-4xl font-black leading-[0.98] tracking-[-0.06em] text-white sm:text-5xl lg:text-[4rem]">
                Build a modern atelier business.
              </h1>

              <p className="mt-4 max-w-md text-base leading-7 text-white/80 sm:text-lg">
                Manage production, orders, staff, customer fitting, quality control, and business growth from one polished platform built for tailoring brands.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button href="/signup" variant="primary" className="rounded-full bg-[#f0c34d] px-6 py-3 text-sm font-semibold text-[#171a2d] shadow-[0_12px_24px_rgba(240,195,77,0.3)] hover:bg-[#f4cd66]">
                  Get started
                </Button>
                <Button href="/login" variant="outline" className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15">
                  Log in
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-1.5">
                  <span className="text-[#f0c34d]">✓</span> Business operations
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-1.5">
                  <span className="text-[#f0c34d]">✓</span> Tailor workflows
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-6 flex max-w-[820px] flex-col items-center justify-center gap-[8px] text-center text-[#1d1f2c]">
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
