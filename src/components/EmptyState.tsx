import Link from "next/link";

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
    <div className="card p-12 flex flex-col items-center text-center gap-3 animate-fade-up" style={{ borderStyle: "dashed" }}>
      <div
        className="w-14 h-14 rounded-full text-white flex items-center justify-center text-2xl motion-safe:animate-empty-float"
        style={{ backgroundImage: "var(--grad-brand)", boxShadow: "var(--glow-brand)" }}
      >
        {icon}
      </div>
      <div className="font-display text-lg font-semibold text-ink">{title}</div>
      <p className="text-sm text-ink-muted max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="btn-shine mt-2 inline-flex items-center rounded-full text-white text-sm font-semibold px-5 py-2.5 hover:brightness-110 transition-all active:scale-[0.97]"
          style={{ backgroundImage: "var(--grad-brand)", boxShadow: "var(--glow-brand)" }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
