"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustStock } from "../actions";

export function StockAdjuster({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function adjust(delta: number) {
    startTransition(async () => {
      await adjustStock(productId, delta);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={() => adjust(-1)}
        className="w-9 h-9 rounded-sm border border-border-strong text-ink font-bold disabled:opacity-50"
      >
        −
      </button>
      <button
        disabled={isPending}
        onClick={() => adjust(1)}
        className="w-9 h-9 rounded-sm border border-border-strong text-ink font-bold disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}
