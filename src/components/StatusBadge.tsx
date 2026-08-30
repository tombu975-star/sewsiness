const TONES: Record<string, string> = {
  Active: "bg-success-soft text-success",
  Completed: "bg-success-soft text-success",
  Paid: "bg-success-soft text-success",
  Passed: "bg-success-soft text-success",
  Approved: "bg-success-soft text-success",
  New: "bg-info-soft text-info",
  "In Progress": "bg-info-soft text-info",
  Pending: "bg-warning-soft text-warning",
  "Low Stock": "bg-warning-soft text-warning",
  Review: "bg-warning-soft text-warning",
  Offered: "bg-warning-soft text-warning",
  Overdue: "bg-danger-soft text-danger",
  "Out of Stock": "bg-danger-soft text-danger",
  Cancelled: "bg-danger-soft text-danger",
  Failed: "bg-danger-soft text-danger",
  Declined: "bg-danger-soft text-danger",
  "Needs Alteration": "bg-danger-soft text-danger",
  Inactive: "bg-sunken text-ink-muted",
  Draft: "bg-sunken text-ink-muted",
};

export function StatusBadge({ value }: { value: string }) {
  const tone = TONES[value] ?? "bg-sunken text-ink-muted";
  return <span className={`badge ${tone}`}>{value}</span>;
}
