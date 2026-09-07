"use client";

import Link from "next/link";
import { useCart } from "@/lib/storefront/cart-context";
import { Button } from "@/components/Button";

export default function CartPage() {
  const { lines, subtotal, removeLine } = useCart();

  return (
    <div className="px-5 pb-8 pt-6">
      <h1 className="font-display text-lg font-semibold text-ink">Your cart</h1>

      {lines.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-sm text-ink-muted">Your cart is empty.</p>
          <Link href="/shop/home" className="mt-3 text-sm font-semibold text-indigo">
            Browse designs
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3">
            {lines.map((line) => (
              <div key={line.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{line.productName}</p>
                    <p className="text-xs text-ink-muted">by {line.tailorName}</p>
                  </div>
                  <button onClick={() => removeLine(line.id)} className="text-xs font-medium text-burgundy">
                    Remove
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(line.selections).map(([k, v]) => (
                    <span key={k} className="rounded-full bg-sunken px-2 py-0.5 text-[11px] text-ink-muted">
                      {v}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">${line.price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-ink-muted">Subtotal</span>
            <span className="font-display text-lg font-semibold text-ink">${subtotal.toFixed(2)}</span>
          </div>
          <Button className="mt-4 w-full py-3.5 text-base">Checkout</Button>
        </>
      )}
    </div>
  );
}
