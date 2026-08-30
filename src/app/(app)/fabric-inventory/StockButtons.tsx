"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustFabricStock } from "../fabrics/actions";

export function StockButtons({ fabricId }: { fabricId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  function adjust(delta: number) {
    startTransition(async () => { await adjustFabricStock(fabricId, delta); router.refresh(); });
  }
  return (
    <div className="flex items-center gap-1.5">
      <button disabled={isPending} onClick={() => adjust(-1)} className="w-7 h-7 rounded-sm border border-border-strong text-ink text-xs font-bold disabled:opacity-50">−</button>
      <button disabled={isPending} onClick={() => adjust(1)} className="w-7 h-7 rounded-sm border border-border-strong text-ink text-xs font-bold disabled:opacity-50">+</button>
    </div>
  );
}
