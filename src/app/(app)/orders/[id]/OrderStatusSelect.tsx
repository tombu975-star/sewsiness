"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "../actions";

export function OrderStatusSelect({
  orderId,
  current,
  options,
}: {
  orderId: string;
  current: string;
  options: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={current}
      disabled={isPending}
      onChange={(e) => {
        const status = e.target.value;
        startTransition(async () => {
          await updateOrderStatus(orderId, status);
          router.refresh();
        });
      }}
      className="rounded-sm border border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-gold disabled:opacity-60"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
