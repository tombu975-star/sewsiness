export default function CustomerOrdersPage() {
  return (
    <div className="flex flex-col items-center px-5 pb-8 pt-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-ink-faint">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 3h12v18l-6-3-6 3V3Z" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="mt-4 text-sm font-medium text-ink">No orders yet</p>
      <p className="mt-1 text-xs text-ink-muted">Orders you place will show up here so you can track them.</p>
    </div>
  );
}
