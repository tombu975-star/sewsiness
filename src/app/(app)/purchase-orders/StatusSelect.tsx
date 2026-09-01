"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePurchaseOrderStatus } from "./actions";

export function StatusSelect({ id, current }: { id: string; current: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <select
      defaultValue={current}
      disabled={isPending}
      onChange={(e) => startTransition(async () => { await updatePurchaseOrderStatus(id, e.target.value); router.refresh(); })}
      className="rounded-sm border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink outline-none focus:border-gold disabled:opacity-60"
    >
      <option>Pending</option><option>Ordered</option><option>Received</option><option>Cancelled</option>
    </select>
  );
}
