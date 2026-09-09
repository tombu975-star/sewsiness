export function OrderStatusGlance({
  newOrders,
  inProduction,
  delivered,
}: {
  newOrders: number;
  inProduction: number;
  delivered: number;
}) {
  const items = [
    { label: "New", value: newOrders, icon: "◔", grad: "var(--grad-amber)", glow: "var(--glow-amber)" },
    { label: "In Production", value: inProduction, icon: "✂", grad: "var(--grad-blue)", glow: "var(--glow-blue)" },
    { label: "Delivered", value: delivered, icon: "✓", grad: "var(--grad-teal)", glow: "var(--glow-teal)" },
  ];
  return (
    <div className="card p-5 mb-6" style={{ boxShadow: "var(--shadow-sm)" }}>
      <h3 className="font-display text-[15px] font-semibold text-ink mb-4">Order status at a glance</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        {items.map((it) => (
          <div key={it.label} className="group cursor-default">
            <div
              className="w-11 h-11 rounded-full text-white flex items-center justify-center mx-auto mb-2 text-lg transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundImage: it.grad, boxShadow: it.glow }}
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
