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
        <div className="mt-16 flex flex-col items-center text-center animate-fade-up">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-white text-2xl motion-safe:animate-empty-float"
            style={{ backgroundImage: "var(--grad-brand)", boxShadow: "var(--glow-brand)" }}
          >
            🛒
          </div>
          <p className="text-sm text-ink-muted">Your cart is empty.</p>
          <Link href="/shop/home" className="mt-3 text-sm font-semibold text-gradient-brand">
            Browse designs
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3">
            {lines.map((line, i) => (
              <div key={line.id} className="card card-glow rounded-2xl p-4 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{line.productName}</p>
                    <p className="text-xs text-ink-muted">by {line.tailorName}</p>
                  </div>
                  <button onClick={() => removeLine(line.id)} className="text-xs font-medium text-danger hover:underline">
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
                <p className="mt-2 text-sm font-semibold text-gradient-brand">${line.price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-ink-muted">Subtotal</span>
            <span className="font-display text-lg font-semibold text-gradient-brand">${subtotal.toFixed(2)}</span>
          </div>
          <Button className="mt-4 w-full py-3.5 text-base">Checkout</Button>
        </>
      )}
    </div>
  );
}
