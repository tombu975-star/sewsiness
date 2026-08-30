// Next.js wraps every route segment under (app) in a Suspense boundary
// keyed to this file, and shows it automatically on navigation and while
// a Server Component's data fetch is in flight — no manual wiring per
// page. The AppShell (sidebar/topbar) stays mounted around this from the
// parent layout, so only the content area shows the loading state.
export default function AppLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-48 bg-sunken rounded-sm mb-2" />
      <div className="h-3 w-72 bg-sunken rounded-sm mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-4 h-20 bg-sunken" />
        ))}
      </div>
      <div className="card p-4 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 bg-sunken rounded-sm" style={{ width: `${85 - i * 8}%` }} />
        ))}
      </div>
    </div>
  );
}
