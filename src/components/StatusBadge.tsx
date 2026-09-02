const TONES: Record<string, { cls: string; dot: string }> = {
  Active: { cls: "bg-success-soft text-success", dot: "var(--success)" },
  Completed: { cls: "bg-success-soft text-success", dot: "var(--success)" },
  Paid: { cls: "bg-success-soft text-success", dot: "var(--success)" },
  Passed: { cls: "bg-success-soft text-success", dot: "var(--success)" },
  Approved: { cls: "bg-success-soft text-success", dot: "var(--success)" },
  New: { cls: "bg-info-soft text-info", dot: "var(--info)" },
  "In Progress": { cls: "bg-info-soft text-info", dot: "var(--info)" },
  Pending: { cls: "bg-warning-soft text-warning", dot: "var(--warning)" },
  "Low Stock": { cls: "bg-warning-soft text-warning", dot: "var(--warning)" },
  Review: { cls: "bg-warning-soft text-warning", dot: "var(--warning)" },
  Offered: { cls: "bg-warning-soft text-warning", dot: "var(--warning)" },
  Overdue: { cls: "bg-danger-soft text-danger", dot: "var(--danger)" },
  "Out of Stock": { cls: "bg-danger-soft text-danger", dot: "var(--danger)" },
  Cancelled: { cls: "bg-danger-soft text-danger", dot: "var(--danger)" },
  Failed: { cls: "bg-danger-soft text-danger", dot: "var(--danger)" },
  Declined: { cls: "bg-danger-soft text-danger", dot: "var(--danger)" },
  "Needs Alteration": { cls: "bg-danger-soft text-danger", dot: "var(--danger)" },
  Inactive: { cls: "bg-sunken text-ink-muted", dot: "var(--ink-faint)" },
  Draft: { cls: "bg-sunken text-ink-muted", dot: "var(--ink-faint)" },
};

export function StatusBadge({ value }: { value: string }) {
  const tone = TONES[value] ?? { cls: "bg-sunken text-ink-muted", dot: "var(--ink-faint)" };
  return (
    <span className={`badge ${tone.cls}`}>
      <span className="w-[5px] h-[5px] rounded-full mr-1.5 flex-shrink-0" style={{ background: tone.dot }} />
      {value}
    </span>
  );
}
