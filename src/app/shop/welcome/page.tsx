import { Button } from "@/components/Button";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="kente-strip" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="-270 -10 520 500" aria-hidden="true">
            <path d="M-160 250 C-80 80, 95 55, 170 150 C215 208, 180 270, 90 292 C-20 320,-85 365,-52 420 C-25 465, 80 458, 160 385" fill="none" stroke="#C9A6E8" strokeWidth="78" strokeLinecap="round" />
            <path d="M-155 250 C-78 105, 80 82, 150 155 C195 202, 165 245, 92 265" fill="none" stroke="#FBBF24" strokeWidth="28" strokeLinecap="round" />
            <path d="M-25 205 L145 20" stroke="#FBBF24" strokeWidth="14" strokeLinecap="round" />
          </svg>
          <span className="font-display text-sm font-bold tracking-wide text-ink">SEWSINESS</span>
        </div>
        <Button href="/login" variant="outline" className="!px-4 !py-2 text-xs">
          Sign in
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-12 pt-8 sm:px-8 sm:pt-14">
        <section className="card relative overflow-hidden bg-surface px-6 py-10 sm:px-12 sm:py-16">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-gold-soft opacity-70" />
          <div className="relative max-w-2xl">
            <div className="eyebrow">Customer marketplace</div>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl">
              Find your fit. Wear your story.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">
              Discover skilled tailors, browse original designs, and create clothing made for the way you live.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/shop/home" className="w-full py-3 sm:w-auto sm:px-7">
                Explore the marketplace
              </Button>
              <Button href="/signup" variant="outline" className="w-full py-3 sm:w-auto sm:px-7">
                Create an account
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "Browse designs", "Explore pieces and inspiration from local makers."],
            ["02", "Choose your tailor", "Find a specialist who understands your style."],
            ["03", "Make it yours", "Share your measurements and bring the look to life."],
          ].map(([number, title, description]) => (
            <div key={number} className="card bg-surface p-5">
              <span className="font-mono text-xs font-semibold text-gold-ink">{number}</span>
              <h2 className="mt-4 font-display text-base font-semibold text-ink">{title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-ink-muted">{description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
