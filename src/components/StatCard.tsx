export function StatCard({
  label,
  value,
  accent,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  delta?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">{label}</div>
      <div className={`font-display text-2xl font-semibold ${accent ? "text-indigo" : "text-ink"}`}>{value}</div>
      {delta && <div className="text-[11.5px] font-semibold mt-2 text-success">{delta}</div>}
    </div>
  );
}
