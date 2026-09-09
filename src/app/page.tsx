import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { Button } from "@/components/Button";
import { TapeStepper } from "@/components/TapeStepper";

const FEATURES: { title: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "Orders & production",
    description: "Every order moves stage by stage on a live board, from intake through fitting to delivery — nothing tracked on paper or in someone's head.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="3.5" y="4" width="5" height="16" rx="1.4" />
        <rect x="9.75" y="4" width="5" height="11" rx="1.4" />
        <rect x="16" y="4" width="4.5" height="7" rx="1.4" />
      </svg>
    ),
  },
  {
    title: "Apprentice training",
    description: "Invite an apprentice, assign her to a trainer, and track her tasks through to a certificate — reassign trainers any time work needs to shift.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 5 2.5 9.5 12 14l9.5-4.5L12 5Z" />
        <path d="M6.5 11.8V17c0 1.2 2.46 2.4 5.5 2.4s5.5-1.2 5.5-2.4v-5.2" />
      </svg>
    ),
  },
  {
    title: "Fabric & costing",
    description: "Fabric inventory, purchase orders, and goods received stay in sync, so every quote is costed against what's actually on the shelf.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M4 6.5c0-1.4 1.8-2.5 4-2.5s4 1.1 4 2.5v11c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5v-11Z" />
        <path d="M12 6.5c0-1.4 1.8-2.5 4-2.5s4 1.1 4 2.5v11c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5" />
      </svg>
    ),
  },
  {
    title: "Payments & receivables",
    description: "Take deposits and balances securely, keep an eye on what customers still owe, and settle freelancer payouts without leaving the platform.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="8.25" />
        <path d="M12 7.75v8.5M14.6 9.4c0-.97-1.16-1.75-2.6-1.75s-2.6.78-2.6 1.75.95 1.4 2.6 1.75c1.9.4 2.6 1 2.6 1.85S12.66 14.6 12 14.6c-1.45 0-2.6-.65-2.6-1.5" />
      </svg>
    ),
  },
];

const ROLES: { title: string; description: string }[] = [
  { title: "Owner (Madam)", description: "Sees and controls everything — every order, payment, staff account, and setting in the business." },
  { title: "Manager", description: "Runs day-to-day operations across branches, without the financial keys." },
  { title: "Trainer", description: "Assigns and grades training tasks for the apprentices on their roster, and signs off when one is ready." },
  { title: "Apprentice", description: "Signs in to their own scoped view — their tasks, their portfolio, and their certificate once earned." },
  { title: "Freelancer", description: "Picks up outside production work and gets paid through the platform, with no seat elsewhere in the business." },
];

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
    <div className="min-h-screen bg-canvas">
      <div className="kente-strip fixed left-0 top-0 z-30" />

      {/* ---------------- Header ---------------- */}
      <header className="sticky top-1 z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="-270 -10 520 500" aria-hidden="true">
            <path d="M-160 250 C-80 80, 95 55, 170 150 C215 208, 180 270, 90 292 C-20 320,-85 365,-52 420 C-25 465, 80 458, 160 385" fill="none" stroke="var(--indigo)" strokeWidth="78" strokeLinecap="round" />
            <path d="M-155 250 C-78 105, 80 82, 150 155 C195 202, 165 245, 92 265" fill="none" stroke="var(--indigo2)" strokeWidth="28" strokeLinecap="round" />
            <path d="M-25 205 L145 20" stroke="var(--indigo2)" strokeWidth="14" strokeLinecap="round" />
          </svg>
          <span className="font-display text-sm font-bold tracking-wide text-ink">SEWSINESS</span>
        </div>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-muted sm:flex">
          <a href="#workflow" className="hover:text-ink">Workflow</a>
          <a href="#features" className="hover:text-ink">What it runs</a>
          <a href="#roles" className="hover:text-ink">Your team</a>
        </nav>
        <Button href="/login" variant="outline" className="!px-4 !py-2 text-xs">
          Sign in
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-20 pt-2 sm:px-8">
        {/* ---------------- Hero ---------------- */}
        <section className="card relative min-h-[560px] overflow-hidden bg-indigo px-6 py-10 sm:px-12 sm:py-16">
          <Image
            src="/images/marketing/cover-2-boutique-catalog.jpg"
            alt="A tailoring business owner, tape measure round her neck, reviewing her catalogue with a colleague"
            fill
            className="object-cover"
            style={{ objectPosition: "center 22%" }}
            sizes="(max-width: 1024px) 100vw, 1200px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A0E52]/93 via-[#2A0E52]/70 to-[#2A0E52]/25" />

          <div className="relative z-10 flex min-h-[470px] items-end">
            <div className="max-w-xl">
              <div className="eyebrow text-[#DCC9FA]">Business console</div>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-white sm:text-[3.4rem]">
                Run your atelier like a house, not a workshop.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/80 sm:text-lg">
                Orders, production, apprentices, fabric, and payments — one workspace built around how a tailoring
                business actually runs, from the Owner down to the newest apprentice.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/signup" className="w-full bg-gold !text-ink hover:brightness-105 sm:w-auto sm:px-7">
                  Create a business account
                </Button>
                <Button href="/login" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto sm:px-7">
                  I already have an account
                </Button>
              </div>
              <p className="mt-7 text-sm text-white/70">
                Looking to order tailor-made clothing instead?{" "}
                <a href="/shop/welcome" className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white">
                  Browse as a customer
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- Workflow ---------------- */}
        <section id="workflow" className="mt-20 scroll-mt-24">
          <div className="max-w-xl">
            <div className="eyebrow">Order lifecycle</div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-[1.9rem]">
              Every order moves through the same five stages — visible to whoever needs to see it.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-base">
              No separate spreadsheet for what's cut, what's fitted, and what's out the door. It's the same board
              your production team is already looking at.
            </p>
          </div>
          <div className="card mt-8 p-6 sm:p-8">
            <TapeStepper
              steps={[
                { label: "New" },
                { label: "Confirmed" },
                { label: "In Production" },
                { label: "Ready" },
                { label: "Delivered" },
              ]}
              activeIndex={2}
            />
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="mt-20 scroll-mt-24">
          <div className="max-w-xl">
            <div className="eyebrow">What it runs</div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-[1.9rem]">
              Four things every atelier has to get right.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-gold-ink"
                  style={{ background: "linear-gradient(145deg, var(--gold-soft), #e4d4fd)" }}
                >
                  {f.icon}
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Roles ---------------- */}
        <section id="roles" className="mt-20 scroll-mt-24">
          <div className="max-w-xl">
            <div className="eyebrow">Your team</div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-[1.9rem]">
              Built for everyone on the floor, not just the Owner.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-base">
              Each account only sees what its role needs to. An apprentice never sees the books; a freelancer never
              sees the rest of the business.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ROLES.map((r) => (
              <div key={r.title} className="card p-5">
                <h3 className="font-display text-sm font-semibold text-ink">{r.title}</h3>
                <p className="mt-1.5 text-[13px] leading-5 text-ink-muted">{r.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Final CTA ---------------- */}
        <section className="mt-20 overflow-hidden rounded-[16px] bg-indigo px-6 py-12 text-center sm:px-12">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Bring your business onto one platform.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/75 sm:text-base">
            Set up your business, invite your team, and start moving your first order through the board today.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/signup" className="w-full bg-gold !text-ink hover:brightness-105 sm:w-auto sm:px-7">
              Create a business account
            </Button>
            <Button href="/login" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto sm:px-7">
              I already have an account
            </Button>
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 border-t border-border px-5 py-8 text-center text-xs text-ink-faint sm:flex-row sm:justify-between sm:px-8 sm:text-left">
        <span>© {new Date().getFullYear()} Sewsiness. Built for tailoring businesses.</span>
        <a href="/shop/welcome" className="font-semibold text-ink-muted hover:text-ink">
          Browse the customer marketplace
        </a>
      </footer>
    </div>
  );
}
