import Link from "next/link";
import { fetchTailors } from "@/lib/storefront/demo-data";

export default async function ExplorePage() {
  const tailors = await fetchTailors();

  return (
    <div className="px-5 pb-8 pt-6">
      <h1 className="font-display text-lg font-semibold text-ink">Explore tailors</h1>
      <p className="mt-1 text-sm text-ink-muted">Find a tailor by style, rating, or specialty.</p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tailors.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
            <span
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: t.avatarHex }}
            >
              {t.initials}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{t.name}</p>
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="#fbbf24" stroke="none">
                  <path d="M12 2.5 15 9l7 1-5.2 4.9L18 22l-6-3.5L6 22l1.2-7.1L2 10l7-1 3-6.5Z" />
                </svg>
                {t.rating}
              </p>
            </div>
            <Link
              href="/shop/customize/custom-shirt-01"
              className="rounded-full bg-indigo-soft px-3 py-1.5 text-xs font-semibold text-indigo"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
