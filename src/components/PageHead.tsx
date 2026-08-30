export function PageHead({
  title,
  subtitle,
  crumb,
  actions,
}: {
  title: string;
  subtitle?: string;
  crumb?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
      <div>
        {crumb && <div className="eyebrow mb-1.5">{crumb}</div>}
        <h1 className="font-display text-[26px] font-semibold text-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-ink-muted mt-1.5 max-w-xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
