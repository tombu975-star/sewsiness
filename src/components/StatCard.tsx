export function StatCard({
  label,
  value,
  accent,
  delta,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  delta?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{label}</div>
        {icon && (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0 ${
              accent ? "bg-indigo-soft text-indigo" : "bg-sunken text-ink-soft"
            }`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className={`font-display text-2xl font-semibold tracking-tight ${accent ? "text-indigo" : "text-ink"}`}>
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
