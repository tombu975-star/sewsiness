export function OrderStatusGlance({
  pending,
  inProgress,
  completed,
}: {
  pending: number;
  inProgress: number;
  completed: number;
}) {
  const items = [
    { label: "Pending", value: pending, icon: "◔", bg: "bg-gold-soft", text: "text-gold-ink", ring: "var(--gold-soft)" },
    { label: "In Progress", value: inProgress, icon: "✂", bg: "bg-info-soft", text: "text-info", ring: "var(--info-soft)" },
    { label: "Completed", value: completed, icon: "✓", bg: "bg-success-soft", text: "text-success", ring: "var(--success-soft)" },
  ];
  return (
    <div className="card p-5 mb-6" style={{ boxShadow: "var(--shadow-sm)" }}>
      <h3 className="font-display text-[15px] font-semibold text-ink mb-4">Order status at a glance</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        {items.map((it) => (
          <div key={it.label}>
            <div
              className={`w-11 h-11 rounded-full ${it.bg} ${it.text} flex items-center justify-center mx-auto mb-2 text-lg`}
              style={{ boxShadow: `0 0 0 4px ${it.ring}, var(--shadow-xs)` }}
            >
              {it.icon}
            </div>
            <div className="font-mono font-semibold text-xl text-ink">{it.value}</div>
            <div className="text-xs text-ink-muted mt-0.5">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
