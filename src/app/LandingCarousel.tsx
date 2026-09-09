"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { TapeStepper } from "@/components/TapeStepper";

const FEATURES: { title: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "Orders & production",
    description: "Every order moves stage by stage on a live board — nothing tracked on paper or in someone's head.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        <rect x="3.5" y="4" width="5" height="16" rx="1.4" />
        <rect x="9.75" y="4" width="5" height="11" rx="1.4" />
        <rect x="16" y="4" width="4.5" height="7" rx="1.4" />
      </svg>
    ),
  },
  {
    title: "Apprentice training",
    description: "Invite an apprentice, assign a trainer, and track tasks through to a certificate.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        <path d="M12 5 2.5 9.5 12 14l9.5-4.5L12 5Z" />
        <path d="M6.5 11.8V17c0 1.2 2.46 2.4 5.5 2.4s5.5-1.2 5.5-2.4v-5.2" />
      </svg>
    ),
  },
  {
    title: "Fabric & costing",
    description: "Fabric inventory, purchase orders, and goods received stay in sync with every quote.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        <path d="M4 6.5c0-1.4 1.8-2.5 4-2.5s4 1.1 4 2.5v11c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5v-11Z" />
        <path d="M12 6.5c0-1.4 1.8-2.5 4-2.5s4 1.1 4 2.5v11c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5" />
      </svg>
    ),
  },
  {
    title: "Payments & receivables",
    description: "Take deposits and balances securely, and settle freelancer payouts on the platform.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        <circle cx="12" cy="12" r="8.25" />
        <path d="M12 7.75v8.5M14.6 9.4c0-.97-1.16-1.75-2.6-1.75s-2.6.78-2.6 1.75.95 1.4 2.6 1.75c1.9.4 2.6 1 2.6 1.85S12.66 14.6 12 14.6c-1.45 0-2.6-.65-2.6-1.5" />
      </svg>
    ),
  },
];

const ROLES: { title: string; description: string }[] = [
  { title: "Owner (Madam)", description: "Sees and controls everything in the business." },
  { title: "Manager", description: "Runs day-to-day operations, without the financial keys." },
  { title: "Trainer", description: "Grades apprentice tasks and signs off when ready." },
  { title: "Apprentice", description: "Their own scoped view — tasks, portfolio, certificate." },
  { title: "Freelancer", description: "Picks up outside work, gets paid on the platform." },
];

const SLIDE_COUNT = 4;

// Every size/spacing value below that affects vertical rhythm uses
// clamp(min, preferred-in-vw/dvh, max) instead of a fixed px value or
// a two-state sm: breakpoint jump. A breakpoint jump still overflows
// on whatever odd viewport height falls between the two states it was
// tuned for (a 720px-tall laptop in a snapped/split window, a phone in
// landscape, a tablet at 85% browser zoom); a clamp() scales
// continuously with the actual viewport instead of assuming one of two
// screens. min-h-0 + overflow-y-auto on <main> stays as a last-resort
// safety net underneath all of this — not the intended experience, but
// a guarantee that content becomes scrollable rather than clipped on
// whatever the clamp() floor can't reach (e.g. a phone at 300% text
// zoom, which no fluid layout can fully absorb).
export function LandingCarousel() {
  const [index, setIndex] = useState(0);

  function go(next: number) {
    setIndex(Math.max(0, Math.min(SLIDE_COUNT - 1, next)));
  }

  return (
    <div
      className="h-[100dvh] overflow-hidden flex flex-col bg-canvas"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      tabIndex={-1}
    >
      <div className="kente-strip flex-shrink-0" />

      {/* ---------------- Header (persistent across slides) ---------------- */}
      <header className="flex-shrink-0 mx-auto flex w-full max-w-6xl items-center justify-between px-[clamp(14px,4vw,32px)] py-[clamp(6px,1.6dvh,16px)]">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="-270 -10 520 500" aria-hidden="true" className="w-[clamp(20px,5vw,28px)] h-[clamp(20px,5vw,28px)] flex-shrink-0">
            <path d="M-160 250 C-80 80, 95 55, 170 150 C215 208, 180 270, 90 292 C-20 320,-85 365,-52 420 C-25 465, 80 458, 160 385" fill="none" stroke="var(--indigo)" strokeWidth="78" strokeLinecap="round" />
            <path d="M-155 250 C-78 105, 80 82, 150 155 C195 202, 165 245, 92 265" fill="none" stroke="var(--indigo2)" strokeWidth="28" strokeLinecap="round" />
            <path d="M-25 205 L145 20" stroke="var(--indigo2)" strokeWidth="14" strokeLinecap="round" />
          </svg>
          <span className="font-display text-[clamp(11px,2.8vw,14px)] font-bold tracking-wide text-ink">SEWSINESS</span>
        </div>
        <Button href="/login" variant="outline" className="!px-[clamp(10px,2.5vw,16px)] !py-[clamp(5px,1.2dvh,8px)] text-[clamp(10px,2.2vw,12px)]">
          Sign in
        </Button>
      </header>

      {/* ---------------- Slide viewport ---------------- */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-[clamp(14px,4vw,32px)] py-[clamp(4px,1.2dvh,16px)]">
          <div className="w-full max-w-3xl">
            {index === 0 && <WelcomeSlide />}
            {index === 1 && <WorkflowSlide />}
            {index === 2 && <FeaturesSlide />}
            {index === 3 && <RolesSlide />}
          </div>
        </div>
      </main>

      {/* ---------------- Footer nav (dots + Back/Next) ---------------- */}
      <footer className="flex-shrink-0 flex items-center justify-center gap-[clamp(10px,3vw,20px)] px-5 py-[clamp(6px,1.6dvh,20px)]">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous"
          className="flex h-[clamp(30px,7vw,36px)] w-[clamp(30px,7vw,36px)] flex-shrink-0 items-center justify-center rounded-full border border-border-strong text-ink-muted hover:bg-sunken disabled:opacity-0 disabled:pointer-events-none transition"
        >
          ←
        </button>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1} of ${SLIDE_COUNT}`}
              onClick={() => go(i)}
              className="h-2 rounded-full transition-all flex-shrink-0"
              style={{ width: i === index ? 22 : 8, background: i === index ? "var(--indigo)" : "var(--border-strong)" }}
            />
          ))}
        </div>

        {index < SLIDE_COUNT - 1 ? (
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next"
            className="flex h-[clamp(30px,7vw,36px)] w-[clamp(30px,7vw,36px)] flex-shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, var(--indigo), var(--indigo2))" }}
          >
            →
          </button>
        ) : (
          <div className="w-[clamp(30px,7vw,36px)] flex-shrink-0" aria-hidden="true" />
        )}
      </footer>
    </div>
  );
}

function WelcomeSlide() {
  return (
    <div className="text-center">
      <div className="eyebrow justify-center">Business console</div>
      <h1 className="mt-[clamp(6px,1.6dvh,16px)] font-display text-[clamp(1.25rem,3.2vw+0.6rem,2.25rem)] font-semibold leading-[1.12] text-ink">
        Run your atelier like a house, not a workshop.
      </h1>
      <p className="mx-auto mt-[clamp(6px,1.4dvh,16px)] max-w-lg text-[clamp(0.75rem,1.6vw+0.35rem,1rem)] leading-[1.55] text-ink-muted">
        Orders, production, apprentices, fabric, and payments — one workspace built around how a tailoring business
        actually runs.
      </p>
      <div className="mt-[clamp(10px,2.4dvh,28px)] flex flex-col items-center justify-center gap-[clamp(6px,1.4vw,12px)] sm:flex-row">
        <Button href="/signup" className="w-full bg-gold !text-ink hover:brightness-105 sm:w-auto sm:px-7">
          Create a business account
        </Button>
        <Button href="/login" variant="outline" className="w-full sm:w-auto sm:px-7">
          I already have an account
        </Button>
      </div>
      <p className="mt-[clamp(8px,1.8dvh,24px)] text-[clamp(0.7rem,1.6vw,0.875rem)] text-ink-muted">
        Looking to order tailor-made clothing instead?{" "}
        <a href="/shop/welcome" className="font-semibold text-indigo underline decoration-indigo/30 underline-offset-2 hover:decoration-indigo">
          Browse as a customer
        </a>
      </p>
    </div>
  );
}

function WorkflowSlide() {
  return (
    <div>
      <div className="text-center">
        <div className="eyebrow justify-center">Order lifecycle</div>
        <h2 className="mt-[clamp(4px,1.2dvh,12px)] font-display text-[clamp(1.05rem,2.4vw+0.5rem,1.5rem)] font-semibold text-ink">
          Every order moves through the same five stages.
        </h2>
        <p className="mx-auto mt-[clamp(4px,1dvh,8px)] max-w-lg text-[clamp(0.75rem,1.6vw+0.3rem,1rem)] leading-[1.5] text-ink-muted">
          No separate spreadsheet for what's cut, fitted, or out the door — it's the same board your production team
          is already looking at.
        </p>
      </div>
      <div className="card mt-[clamp(10px,2.4dvh,24px)] p-[clamp(12px,3vw,28px)]">
        <TapeStepper
          steps={[{ label: "New" }, { label: "Confirmed" }, { label: "In Production" }, { label: "Ready" }, { label: "Delivered" }]}
          activeIndex={2}
        />
      </div>
    </div>
  );
}

function FeaturesSlide() {
  return (
    <div>
      <div className="text-center">
        <div className="eyebrow justify-center">What it runs</div>
        <h2 className="mt-[clamp(4px,1.2dvh,12px)] font-display text-[clamp(1.05rem,2.4vw+0.5rem,1.5rem)] font-semibold text-ink">
          Four things every atelier has to get right.
        </h2>
      </div>
      <div className="mt-[clamp(8px,2dvh,24px)] grid gap-[clamp(6px,1.6vw,12px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-[clamp(10px,2.4vw,20px)]">
            <span
              className="flex w-[clamp(30px,6vw,40px)] h-[clamp(30px,6vw,40px)] items-center justify-center rounded-xl text-gold-ink p-[clamp(6px,1.4vw,9px)]"
              style={{ background: "linear-gradient(145deg, var(--gold-soft), #e4d4fd)" }}
            >
              {f.icon}
            </span>
            <h3 className="mt-[clamp(6px,1.4dvh,12px)] font-display text-[clamp(0.8rem,1.6vw+0.3rem,0.9rem)] font-semibold text-ink">{f.title}</h3>
            <p className="mt-[clamp(2px,0.6dvh,4px)] text-[clamp(0.7rem,1.4vw+0.25rem,0.8rem)] leading-[1.45] text-ink-muted">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolesSlide() {
  return (
    <div>
      <div className="text-center">
        <div className="eyebrow justify-center">Your team</div>
        <h2 className="mt-[clamp(4px,1.2dvh,12px)] font-display text-[clamp(1.05rem,2.4vw+0.5rem,1.5rem)] font-semibold text-ink">
          Built for everyone on the floor, not just the Owner.
        </h2>
      </div>
      <div className="mt-[clamp(8px,2dvh,24px)] grid gap-[clamp(6px,1.4vw,10px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {ROLES.map((r) => (
          <div key={r.title} className="card p-[clamp(8px,2vw,14px)] text-left">
            <h3 className="font-display text-[clamp(0.78rem,1.6vw+0.3rem,0.875rem)] font-semibold text-ink">{r.title}</h3>
            <p className="mt-[clamp(1px,0.4dvh,4px)] text-[clamp(0.68rem,1.4vw+0.2rem,0.75rem)] leading-[1.4] text-ink-muted">{r.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-[clamp(10px,2.4dvh,24px)] flex flex-col items-center justify-center gap-[clamp(6px,1.4vw,12px)] sm:flex-row">
        <Button href="/signup" className="w-full bg-gold !text-ink hover:brightness-105 sm:w-auto sm:px-7">
          Create a business account →
        </Button>
        <Button href="/login" variant="outline" className="w-full sm:w-auto sm:px-7">
          I already have an account
        </Button>
      </div>
    </div>
  );
}
