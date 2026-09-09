import Link from "next/link";
import { CATEGORIES, fetchFeaturedDesign, fetchTailors } from "@/lib/storefront/demo-data";
import { getShopCustomer } from "@/lib/auth/require-shop-customer";

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  cloths: (
    <path d="M8 4h8l3 4-3 2v10H8V10L5 8l3-4Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
  ),
  bags: (
    <>
      <rect x="5" y="9" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  shoes: (
    <path
      d="M4 18c0-2 1-3 3-4l6-3 3 1c2 1 4 1 6 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  uniform: (
    <path
      d="M9 4h6l1.5 3L20 9l-3 2v9H7v-9l-3-2 3.5-2L9 4Z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  suit: (
    <path
      d="M9 4 6 6l1 3-2 2 1 9h12l1-9-2-2 1-3-3-2-2 2h-2L9 4Z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
      strokeLinejoin="round"
    />
  ),
};

const CATEGORY_TONES = [
  { grad: "var(--grad-brand)", glow: "var(--glow-brand)" },
  { grad: "var(--grad-teal)", glow: "var(--glow-teal)" },
  { grad: "var(--grad-rose)", glow: "var(--glow-rose)" },
  { grad: "var(--grad-amber)", glow: "var(--glow-amber)" },
  { grad: "var(--grad-blue)", glow: "var(--glow-blue)" },
];

export default async function ShopHomePage() {
  const [featured, tailors, shopper] = await Promise.all([fetchFeaturedDesign(), fetchTailors(), getShopCustomer()]);
  const firstName = shopper?.customer.full_name?.split(" ")[0];

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-faint">Good morning</p>
          <p className="font-display text-lg font-semibold text-ink">{firstName ? `Hello, ${firstName}` : "Hello there"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/shop/account"
            aria-label="Your account"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sunken text-ink-muted hover:text-indigo2 hover:bg-indigo-soft transition-colors active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" strokeLinecap="round" />
            </svg>
          </Link>
          <Link
            href="/shop/orders"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sunken text-ink-muted hover:text-indigo2 hover:bg-indigo-soft transition-colors active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" strokeLinejoin="round" />
              <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>

      <label className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink-muted transition-colors focus-within:border-indigo2 focus-within:shadow-[0_0_0_3px_var(--indigo-soft)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Search tailors, styles..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </label>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Featured Design</h2>
        <Link href="/shop/explore" className="text-xs font-semibold text-indigo">
          See All
        </Link>
      </div>

      <Link
        href="/shop/customize/custom-shirt-01"
        className="mt-3 block overflow-hidden rounded-2xl p-5 text-white relative animate-fade-up"
        style={{ backgroundImage: "var(--grad-brand-deep)", boxShadow: "var(--glow-brand)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(360px circle at 90% -20%, rgba(255,255,255,0.22), transparent 60%)" }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <p className="max-w-[160px] font-display text-[15px] font-semibold leading-snug">{featured.title}</p>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2">
              <path
                d="M12 20.5s-7.5-4.6-9.6-9.2C1.1 8 2.6 4.8 5.9 4.1c2-.4 3.8.5 4.9 2.1a5 5 0 0 1 1.2 1.6 5 5 0 0 1 1.2-1.6c1.1-1.6 2.9-2.5 4.9-2.1 3.3.7 4.8 3.9 3.5 7.2C19.5 15.9 12 20.5 12 20.5Z"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <div className="relative mt-4 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="#fbbf24" stroke="none">
              <path d="M12 2.5 15 9l7 1-5.2 4.9L18 22l-6-3.5L6 22l1.2-7.1L2 10l7-1 3-6.5Z" />
            </svg>
            {featured.rating}
          </span>
          <span className="text-white/70">{featured.orderCount}+ Orders</span>
        </div>
      </Link>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={i === 0 ? { width: "16px", backgroundImage: "var(--grad-brand)" } : { width: "6px", background: "var(--border-strong)" }}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-4">
        {CATEGORIES.map((c, i) => {
          const tone = CATEGORY_TONES[i % CATEGORY_TONES.length];
          return (
            <Link
              key={c.id}
              href={`/shop/explore?category=${c.id}`}
              className="flex flex-col items-center gap-1.5 text-center group"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
                style={{ backgroundImage: tone.grad, boxShadow: tone.glow }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  {CATEGORY_ICON[c.icon]}
                </svg>
              </span>
              <span className="text-[11px] text-ink-muted">{c.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Top-Rated Tailors</h2>
        <Link href="/shop/explore" className="text-xs font-semibold text-indigo">
          See All
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tailors.slice(0, 3).map((t, i) => (
          <div key={t.id} className="card card-hover card-glow rounded-2xl p-4 text-center animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <span
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white ring-4 ring-offset-2 ring-offset-surface"
              style={{ background: t.avatarHex, boxShadow: "var(--shadow-sm)", "--tw-ring-color": `${t.avatarHex}33` } as React.CSSProperties}
            >
              {t.initials}
            </span>
            <p className="mt-2 text-sm font-semibold text-ink">{t.name}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-ink-muted">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="#fbbf24" stroke="none">
                <path d="M12 2.5 15 9l7 1-5.2 4.9L18 22l-6-3.5L6 22l1.2-7.1L2 10l7-1 3-6.5Z" />
              </svg>
              {t.rating}
            </p>
            <Link
              href={`/shop/explore?tailor=${t.id}`}
              className="btn-shine mt-3 block rounded-full py-1.5 text-xs font-semibold text-white transition-transform active:scale-95"
              style={{ backgroundImage: "var(--grad-brand)" }}
            >
              Find Your Tailor
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
