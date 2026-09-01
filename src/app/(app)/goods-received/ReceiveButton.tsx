"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePurchaseOrderStatus } from "../purchase-orders/actions";
import { Spinner } from "@/components/Spinner";

export function ReceiveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await updatePurchaseOrderStatus(id, "Received"); router.refresh(); })}
      className="inline-flex items-center gap-1.5 rounded-sm bg-gold text-[#3a2400] text-xs font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-70 disabled:cursor-wait"
    >
      {isPending && <Spinner className="w-3 h-3" />}
      {isPending ? "Marking…" : "Mark Received"}
    </button>
  );
}
