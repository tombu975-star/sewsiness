export function EmptyState({
  icon = "+",
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="card p-12 flex flex-col items-center text-center gap-3" style={{ borderStyle: "dashed" }}>
      <div
        className="w-12 h-12 rounded-full text-gold-ink flex items-center justify-center text-xl"
        style={{ background: "linear-gradient(145deg, var(--gold-soft), #fde9a8)", boxShadow: "var(--shadow-xs)" }}
      >
        {icon}
      </div>
      <div className="font-display text-lg font-semibold text-ink">{title}</div>
      <p className="text-sm text-ink-muted max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-2 inline-flex items-center rounded-lg bg-gold text-[#3a2400] text-sm font-semibold px-4 py-2.5 hover:brightness-[1.03] transition-all active:scale-[0.98]"
          style={{ boxShadow: "var(--shadow-gold)" }}
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
