import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { Button } from "@/components/Button";
import { TapeStepper } from "@/components/TapeStepper";

function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-270 -10 520 500" aria-hidden="true" className="shrink-0">
      <path
        d="M-160 250 C-80 80, 95 55, 170 150 C215 208, 180 270, 90 292 C-20 320,-85 365,-52 420 C-25 465, 80 458, 160 385"
        fill="none"
        stroke="#14213D"
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

function FeatureIcon({ path }: { path: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const FEATURES = [
  {
    icon: "M4 4h11v16H4zM8 4v3M12 4v3M4 9h11M4 14h11M17 8h3v8h-3z",
    title: "Orders & Production",
    description: "Move every order from intake to delivery on a live production board, with fitting and quality checks along the way.",
  },
  {
    icon: "M12 3 3 7l9 4 9-4-9-4ZM3 7v6l9 4 9-4V7M7 9.5V15c0 1.5 2.5 3 5 3s5-1.5 5-3V9.5",
    title: "Apprentice Training",
    description: "Invite apprentices, assign each one to a trainer, track their training tasks, and issue a certificate the moment they qualify.",
  },
  {
    icon: "M4 6h16M4 6v13a1 1 0 0 0 1 1h4V6M9 20h6M15 6v14h4a1 1 0 0 0 1-1V6M8 3h8v3H8z",
    title: "Fabric & Costing",
    description: "Keep fabric inventory, purchase orders and goods received in sync, and cost every order correctly before you quote it.",
  },
  {
    icon: "M4 8h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 8l2.5-4h11L20 8M9 12.5h6",
    title: "Payments & Receivables",
    description: "Take secure payments, chase outstanding receivables, and pay your freelancers, without leaving the platform.",
  },
];

const ROLES = [
  { role: "Owner (Madam)", note: "Full control of the business — every order, payment, staff account and setting." },
  { role: "Manager", note: "Runs day-to-day operations across branches, without the financial keys." },
  { role: "Trainer", note: "Assigns and grades training tasks, and signs off on apprentices who are ready." },
  { role: "Apprentice", note: "Signs in to a scoped view of just their own tasks, portfolio and certificate." },
  { role: "Freelancer", note: "Picks up outside production work and gets paid through the platform." },
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

      <header className="sticky top-1 z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="font-display text-sm font-bold tracking-wide text-ink">SEWSINESS</span>
        </div>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-muted sm:flex">
          <a href="#workflow" className="hover:text-ink">Workflow</a>
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#roles" className="hover:text-ink">Your team</a>
        </nav>
        <Button href="/login" variant="outline" className="!px-4 !py-2 text-xs">
          Sign in
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-16 sm:px-8">
        {/* ---------------- Hero ---------------- */}
        <section className="card relative min-h-[560px] overflow-hidden bg-indigo px-6 py-10 sm:px-12 sm:py-16">
          <Image
            src="/images/marketing/cover-2-boutique-catalog.jpg"
            alt="A tailor with a tape measure around her neck reviewing a garment catalog with a colleague"
            fill
            className="object-cover opacity-90"
            style={{ objectPosition: "center 22%" }}
            sizes="(max-width: 1024px) 100vw, 1200px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1830]/92 via-[#14213d]/70 to-[#14213d]/25" />

          <div className="relative z-10 flex min-h-[470px] items-end">
            <div className="max-w-xl">
              <div className="eyebrow text-[#f7ebd2]">Business console</div>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[3.4rem]">
                Build a modern atelier business.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/80 sm:text-lg">
                Orders, production, apprentices and payments — one workspace built around how a tailoring business actually runs, from first fitting to final delivery.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/signup" className="w-full bg-gold !text-ink hover:brightness-105 sm:w-auto sm:px-7">
                  Get started
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
        <section id="workflow" className="mt-16 scroll-mt-20 sm:mt-24">
          <div className="max-w-lg">
            <div className="eyebrow">How an order moves</div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Every order follows the same measured path.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-[15px]">
              From the moment it's taken to the moment it's collected, an order's stage is always visible — to you, your staff, and the customer.
            </p>
          </div>
          <div className="card mt-8 p-6 sm:p-8">
            <TapeStepper
              steps={[
                { label: "New", sub: "Order taken" },
                { label: "Confirmed", sub: "Deposit paid" },
                { label: "In Production", sub: "Cutting & sewing" },
                { label: "Ready", sub: "Quality checked" },
                { label: "Delivered", sub: "Collected" },
              ]}
              activeIndex={2}
            />
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="mt-16 scroll-mt-20 sm:mt-24">
          <div className="max-w-lg">
            <div className="eyebrow">What's inside</div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Everything the atelier runs on.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5 sm:p-6">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gold-ink"
                  style={{ background: "linear-gradient(145deg, var(--gold-soft), #fde9a8)" }}
                >
                  <FeatureIcon path={f.icon} />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Roles ---------------- */}
        <section id="roles" className="mt-16 scroll-mt-20 sm:mt-24">
          <div className="max-w-lg">
            <div className="eyebrow">Built for your whole team</div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
              One workspace, sized to every role.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-[15px]">
              Everyone signs in at the same door and sees only what their role needs.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.role} className="card p-5">
                <div className="font-display text-sm font-semibold text-ink">{r.role}</div>
                <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">{r.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Closing CTA ---------------- */}
        <section className="mt-16 overflow-hidden rounded-[var(--radius-lg)] bg-indigo px-6 py-10 text-center sm:mt-24 sm:px-12 sm:py-14">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Ready to run your atelier this way?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/75 sm:text-[15px]">
            Set up your business in a few minutes — no card required to get started.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/signup" className="w-full bg-gold !text-ink hover:brightness-105 sm:w-auto sm:px-7">
              Get started
            </Button>
            <Button href="/login" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto sm:px-7">
              I already have an account
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 border-t border-border px-5 py-8 text-xs text-ink-faint sm:flex-row sm:justify-between sm:px-8">
        <div className="flex items-center gap-2">
          <BrandMark size={18} />
          <span className="font-semibold text-ink-muted">SEWSINESS</span>
        </div>
        <p>© {new Date().getFullYear()} Sewsiness. Built for tailoring brands.</p>
      </footer>
    </div>
  );
}
