import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { Button } from "@/components/Button";
import { getPlatformSettings } from "@/lib/platform-settings";

function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative h-[620px] w-[290px] rounded-[38px] border border-[#ded7d3] bg-[#f2f1f0] p-2 shadow-[0_28px_60px_rgba(27,24,34,0.18)] ${className}`}
      style={{ boxShadow: "0 24px 54px rgba(24, 24, 32, 0.14), inset 0 0 0 2px rgba(255,255,255,0.38)" }}
    >
      <div className="absolute inset-x-0 top-2 z-20 mx-auto h-1.5 w-20 rounded-full bg-[#1f1f23]" />
      <div className="relative h-full overflow-hidden rounded-[30px] bg-[#f6f3f2]">{children}</div>
    </div>
  );
}

function StatusBar({ label = "9:41" }: { label?: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 text-[11px] font-semibold text-[#1c1d21]">
      <span>{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full border border-[#1c1d21]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#1c1d21]" />
        <span className="h-2 w-8 rounded-full bg-[#1c1d21]" />
      </div>
    </div>
  );
}

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
    <main className="min-h-screen bg-[#d6d1cf] px-4 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-5 xl:flex-row xl:items-end xl:justify-center">
        <PhoneFrame>
          <div className="relative h-full bg-[#e9e3df]">
            <StatusBar />
            <div className="relative h-[440px] overflow-hidden">
              <Image src={heroImage} alt="Tailor working at a sewing machine" fill className="object-cover" sizes="290px" priority />
              <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/10 via-[#000000]/10 to-[#000000]/55" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-4 pb-5">
              <div className="rounded-[24px] bg-[#f7f6f6]/12 px-4 pb-4 pt-3 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between text-[10px] font-medium text-white/85">
                  <span>Tailor-made clothing</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1">New</span>
                </div>
                <h1 className="mb-2 text-[18px] font-bold leading-tight text-white">Tailor-made clothing</h1>
                <p className="mb-4 text-[12px] leading-relaxed text-white/80">
                  Tailor-made clothing offers unmatched comfort, style, and precision.
                </p>
                <div className="flex justify-center">
                  <Button href="/signup" variant="primary" className="w-full rounded-full bg-[#f0c34d] text-[#1d1b2e] hover:bg-[#f5cf69]">
                    Get started
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PhoneFrame>

        <PhoneFrame className="-mt-1">
          <div className="h-full bg-[#f5f6f9]">
            <StatusBar />
            <div className="px-4 pb-3">
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f2d47d] to-[#b57c6d] text-[10px] font-bold text-white">H</div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#1d1e22]">Hello, Sakib</div>
                    <div className="text-[10px] text-[#687085]">Good morning</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#1d1e22]">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">◌</span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">☰</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-full border border-[#e3e7ef] bg-white px-3 py-2 text-[11px] text-[#8a8f9d] shadow-sm">
                <span>⌕</span>
                <span>Search tailor styles...</span>
              </div>

              <div className="mt-4 rounded-[22px] bg-gradient-to-br from-[#1a2c60] to-[#1f3d74] p-4 text-white shadow-[0_20px_24px_rgba(34,57,108,0.3)]">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-medium text-white/70">Featured Design</div>
                  <button className="rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[10px] font-medium text-white">See all</button>
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-semibold">Tailored Premium</div>
                    <div className="mt-1 text-[11px] text-white/75">Suite For Business &amp; Formal</div>
                    <div className="mt-3 flex items-center gap-1 text-[#f7d774]">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span className="text-white/55">★</span>
                    </div>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-white/10 ring-1 ring-white/20">
                    <div className="h-12 w-8 rounded-[10px] bg-gradient-to-b from-[#f7d774] to-[#e7b245] shadow-inner" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="text-[11px] text-white/70">4.8 • 151 Orders</div>
                  <button className="rounded-full bg-[#f7d774] px-4 py-2 text-[11px] font-semibold text-[#1f1c29]">View profile</button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-5 gap-2 text-center text-[10px] font-medium text-[#3a4257]">
                {[
                  ["Cloths", "◫"],
                  ["Bags", "◍"],
                  ["Shoes", "◌"],
                  ["Uniform", "◐"],
                  ["Suit", "◈"],
                ].map(([label, icon]) => (
                  <div key={label} className="rounded-2xl bg-white px-1 py-3 shadow-sm ring-1 ring-[#eef0f5]">
                    <div className="mb-2 text-lg text-[#1a1d2f]">{icon}</div>
                    <div>{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between text-[12px] font-semibold text-[#1d1e22]">
                <span>Top • Rated Tailors</span>
                <span className="text-[#6b7280]">See all</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {["Thomas", "Edward"].map((name, index) => (
                  <div key={name} className="rounded-[22px] bg-white p-3 shadow-sm ring-1 ring-[#edf0f5]">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f0d7ad] to-[#7b4d4c] text-[10px] font-bold text-white">
                      {name.slice(0, 1)}
                    </div>
                    <div className="text-[12px] font-semibold text-[#1d1e22]">{name}</div>
                    <div className="mt-1 text-[10px] text-[#6e7483]">{index === 0 ? "4.8 • 82 orders" : "4.7 • 61 orders"}</div>
                    <button className="mt-3 w-full rounded-full bg-[#edf2ff] px-2 py-1.5 text-[10px] font-semibold text-[#2f467d]">
                      {index === 0 ? "Find Your Tailor" : "Find Your Tailor"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#edf0f5] bg-white/90 px-5 py-3 backdrop-blur-sm">
              {[
                ["Home", "⌂"],
                ["Explore", "◫"],
                ["Favourite", "♡"],
                ["Message", "✉"],
                ["Orders", "▣"],
              ].map(([label, icon], index) => (
                <div key={label} className={`flex flex-col items-center gap-1 text-[9px] ${index === 0 ? "text-[#1a1d2f]" : "text-[#7c8393]"}`}>
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </PhoneFrame>

        <PhoneFrame className="-mt-4">
          <div className="h-full bg-[#f7f6f8]">
            <StatusBar />
            <div className="px-4 pb-3">
              <div className="mt-2 flex items-center justify-between text-[#1b1d21]">
                <button aria-label="Back" className="text-xl">‹</button>
                <div className="text-[13px] font-semibold">Customize your shirt</div>
                <button aria-label="More" className="text-xl">⋮</button>
              </div>

              <div className="mt-4 flex justify-center">
                <div className="relative flex h-[210px] w-[180px] items-center justify-center rounded-[24px] bg-gradient-to-b from-[#f1f4f5] to-[#dfe7ec]">
                  <div className="absolute left-1/2 top-[16%] h-[140px] w-[112px] -translate-x-1/2 rounded-[28px] bg-gradient-to-b from-[#122e8f] to-[#0d1f53] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2)]" />
                  <div className="absolute left-1/2 top-[14%] h-8 w-10 -translate-x-1/2 rounded-b-[12px] border border-white/40 bg-white/10" />
                  <div className="absolute left-1/2 top-[18%] h-[54px] w-[42px] -translate-x-1/2 rounded-[12px] border border-white/20 bg-white/10" />
                  <div className="absolute left-[23%] top-[26%] h-[110px] w-[14px] rounded-full bg-white/10" />
                  <div className="absolute right-[23%] top-[26%] h-[110px] w-[14px] rounded-full bg-white/10" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                {[
                  ["#56d0d3", "cyan"],
                  ["#0d1f53", "navy"],
                  ["#f2c76a", "gold"],
                  ["#e8edf2", "silver"],
                ].map(([swatch, label]) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <span className="h-6 w-6 rounded-full border-2 border-white shadow-sm" style={{ background: swatch }} />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-[18px] bg-[#ffffff] px-4 py-3 shadow-sm ring-1 ring-[#edf0f5]">
                <div className="text-[12px] font-medium text-[#1b1d21]">Shirt price</div>
                <div className="text-[15px] font-bold text-[#1b1d21]">$15.75</div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] text-[#4d5669]">
                {[
                  ["Color", "◉"],
                  ["Sleeves", "◫"],
                  ["Pocket", "▣"],
                  ["Half pocket", "◧"],
                ].map(([label, icon]) => (
                  <div key={label} className="rounded-2xl bg-white px-1 py-3 shadow-sm ring-1 ring-[#edf0f5]">
                    <div className="mb-2 text-lg text-[#1a1d2e]">{icon}</div>
                    <div>{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="rounded-full border border-[#e5e8ee] bg-white px-4 py-2 text-[12px] font-semibold text-[#1b1d21] shadow-sm">
                  Upload Design
                </button>
                <button className="rounded-full border border-[#e5e8ee] bg-white px-4 py-2 text-[12px] font-semibold text-[#1b1d21] shadow-sm">
                  Call Tailor
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="rounded-full border border-[#dfe5ef] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#1b1d21]">
                  Add to cart
                </button>
                <button className="rounded-full bg-[#1f2d60] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_20px_rgba(31,45,96,0.22)]">
                  Order
                </button>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#edf0f5] bg-white/90 px-4 py-3 backdrop-blur-sm">
              {[
                ["Home", "⌂"],
                ["Explore", "◫"],
                ["Favourite", "♡"],
                ["Message", "✉"],
                ["Orders", "▣"],
              ].map(([label, icon], index) => (
                <div key={label} className={`flex flex-col items-center gap-1 text-[9px] ${index === 0 ? "text-[#1a1d2f]" : "text-[#7c8393]"}`}>
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </PhoneFrame>
      </div>

      <div className="mx-auto mt-6 flex max-w-[720px] flex-col items-center justify-center gap-3 text-center text-[#1d1f2c]">
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-[#2e3559] underline-offset-4 hover:underline">
            Log in
          </Link>
          <span className="text-[#8b8f9b]">|</span>
          <Link href="/signup" className="text-sm font-semibold text-[#2e3559] underline-offset-4 hover:underline">
            Create a business account
          </Link>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs font-medium text-[#575d6b]">
          <Link href="/open-account" className="hover:underline">
            Open an Account
          </Link>
          <span>|</span>
          <Link href="/forgot-account" className="hover:underline">
            Forgot account number?
          </Link>
        </div>
      </div>
    </main>
  );
}
