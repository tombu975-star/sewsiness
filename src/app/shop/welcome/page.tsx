import Image from "next/image";
import { Button } from "@/components/Button";
import { getPlatformSettings } from "@/lib/platform-settings";

// Same fluid-sizing approach as LandingCarousel.tsx: every value that
// affects vertical rhythm is clamp(min, vw/dvh-driven, max) rather than
// a fixed px value or a single sm: breakpoint jump, so this scales
// continuously across screen sizes instead of only being tuned for two
// of them. overflow-y-auto on <main> is a last-resort safety net, not
// the intended experience.
export default async function WelcomePage() {
  const platform = await getPlatformSettings();
  const heroImage = platform.coverImages[0] ?? "/images/marketing/cover-1-atelier-review.jpg";

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-canvas">
      <div className="kente-strip flex-shrink-0" />
      <header className="flex-shrink-0 mx-auto flex w-full max-w-6xl items-center justify-between px-[clamp(14px,4vw,32px)] py-[clamp(6px,1.6dvh,16px)]">
        <div className="flex items-center gap-2">
          <svg viewBox="-270 -10 520 500" aria-hidden="true" className="w-[clamp(20px,5vw,28px)] h-[clamp(20px,5vw,28px)] flex-shrink-0">
            <path d="M-160 250 C-80 80, 95 55, 170 150 C215 208, 180 270, 90 292 C-20 320,-85 365,-52 420 C-25 465, 80 458, 160 385" fill="none" stroke="var(--indigo)" strokeWidth="78" strokeLinecap="round" />
            <path d="M-155 250 C-78 105, 80 82, 150 155 C195 202, 165 245, 92 265" fill="none" stroke="var(--indigo2)" strokeWidth="28" strokeLinecap="round" />
            <path d="M-25 205 L145 20" stroke="var(--indigo2)" strokeWidth="14" strokeLinecap="round" />
          </svg>
          <span className="font-display text-[clamp(11px,2.8vw,14px)] font-bold tracking-wide text-ink">SEWSINESS</span>
        </div>
        <Button href="/shop/login" variant="outline" className="!px-[clamp(10px,2.5vw,16px)] !py-[clamp(5px,1.2dvh,8px)] text-[clamp(10px,2.2vw,12px)]">
          Sign in
        </Button>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto mx-auto flex w-full max-w-6xl flex-col px-[clamp(14px,4vw,32px)] pb-[clamp(8px,1.6dvh,16px)] pt-[clamp(2px,0.6dvh,4px)]">
        <section className="card relative flex-1 min-h-[220px] overflow-hidden bg-indigo px-[clamp(16px,4vw,48px)] py-[clamp(12px,2.4dvh,32px)]">
          <Image src={heroImage} alt="Tailor and customer reviewing fabric options" fill className="object-cover opacity-80" sizes="(max-width: 1024px) 100vw, 1200px" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17151b]/90 via-[#17151b]/55 to-[#17151b]/20" />
          <div className="relative z-10 flex h-full min-h-[180px] items-end">
            <div className="max-w-2xl">
              <div className="eyebrow text-[#f7ebd2]">Customer marketplace</div>
              <h1 className="mt-[clamp(4px,1.2dvh,12px)] font-display text-[clamp(1.15rem,3.2vw+0.5rem,2.5rem)] font-semibold leading-[1.1] text-white">
                Find your fit. Wear your story.
              </h1>
              <p className="mt-[clamp(4px,1dvh,10px)] max-w-xl text-[clamp(0.75rem,1.6vw+0.3rem,1.05rem)] leading-[1.5] text-white/80">
                Discover skilled tailors, browse original designs, and create clothing made for the way you live.
              </p>
              <div className="mt-[clamp(8px,2dvh,20px)] flex flex-col gap-[clamp(6px,1.4vw,12px)] sm:flex-row sm:items-center">
                <Button href="/shop/home" className="w-full bg-gold !text-ink hover:brightness-105 sm:w-auto sm:px-7">
                  Explore the marketplace
                </Button>
                <Button href="/shop/signup" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto sm:px-7">
                  Create customer account
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-[clamp(8px,1.6dvh,12px)] grid gap-[clamp(6px,1.6vw,12px)] flex-shrink-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {[
            ["01", "Browse designs", "Explore pieces and inspiration from local makers."],
            ["02", "Choose your tailor", "Find a specialist who understands your style."],
            ["03", "Make it yours", "Share your measurements and bring the look to life."],
          ].map(([number, title, description]) => (
            <div key={number} className="card bg-surface p-[clamp(8px,2vw,14px)]">
              <span className="font-mono text-[clamp(0.65rem,1.4vw,0.75rem)] font-semibold text-gold-ink">{number}</span>
              <h2 className="mt-[clamp(3px,0.8dvh,8px)] font-display text-[clamp(0.8rem,1.6vw+0.3rem,0.9rem)] font-semibold text-ink">{title}</h2>
              <p className="mt-[clamp(1px,0.4dvh,4px)] text-[clamp(0.7rem,1.4vw+0.25rem,0.8rem)] leading-[1.45] text-ink-muted">{description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
