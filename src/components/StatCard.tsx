// Five brand-coherent tones a dashboard's stat row can cycle through so a
// wall of tiles reads as distinct at a glance instead of one repeated
// indigo chip — while every tone still shares the same gradient system
// (see --grad-*/--glow-* in globals.css), so nothing here freelances a
// one-off color.
const TONES: Record<string, { grad: string; glow: string }> = {
  brand: { grad: "var(--grad-brand)", glow: "var(--glow-brand)" },
  teal: { grad: "var(--grad-teal)", glow: "var(--glow-teal)" },
  rose: { grad: "var(--grad-rose)", glow: "var(--glow-rose)" },
  amber: { grad: "var(--grad-amber)", glow: "var(--glow-amber)" },
  blue: { grad: "var(--grad-blue)", glow: "var(--glow-blue)" },
};

export function StatCard({
  label,
  value,
  accent,
  delta,
  icon,
  tone = "brand",
  // Staggers the fade-up entrance across a row of tiles (index * 60ms).
  // Purely cosmetic — omit it and the card still renders instantly.
  index = 0,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  delta?: string;
  icon?: React.ReactNode;
  tone?: "brand" | "teal" | "rose" | "amber" | "blue";
  index?: number;
}) {
  const t = TONES[tone] ?? TONES.brand;
  return (
    <div
      className="card card-hover card-glow p-4 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{label}</div>
        {icon && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] flex-shrink-0 text-white transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundImage: t.grad, boxShadow: t.glow }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className={`font-display text-2xl font-semibold tracking-tight ${accent ? "text-gradient-brand" : "text-ink"}`}>
        {value}
      </div>
      {delta && (
        <div className="text-[11.5px] font-semibold mt-2 text-success flex items-center gap-1">
          <span>↑</span>
          {delta}
        </div>
      )}
    </div>
  );
}
