export default function ShopLoading() {
  // Renders inside ShopLayout (bottom nav + CartProvider stay mounted),
  // just replacing the page content while the next page's data loads —
  // a plain full-screen spinner here would otherwise flash over the
  // whole app shell on every single tab switch.
  return (
    <div className="px-5 pb-8 pt-6" aria-hidden="true">
      <div className="h-5 w-40 animate-pulse rounded-full bg-sunken" />
      <div className="mt-5 flex flex-col gap-3 sm:grid sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
