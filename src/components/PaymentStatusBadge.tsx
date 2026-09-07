export function PaymentStatusBadge({ total, paid }: { total: number; paid: number }) {
  const balance = total - paid;

  let label: string;
  let cls: string;
  let dot: string;

  if (paid <= 0) {
    label = "Unpaid";
    cls = "bg-danger-soft text-danger";
    dot = "var(--danger)";
  } else if (balance > 0) {
    label = "Partial";
    cls = "bg-warning-soft text-warning";
    dot = "var(--warning)";
  } else {
    label = "Paid";
    cls = "bg-success-soft text-success";
    dot = "var(--success)";
  }

  return (
    <span className={`badge ${cls}`}>
      <span className="w-[5px] h-[5px] rounded-full mr-1.5 flex-shrink-0" style={{ background: dot }} />
      {label}
    </span>
  );
}
