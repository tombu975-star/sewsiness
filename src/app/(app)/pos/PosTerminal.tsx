"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeSale, type CartLine } from "./actions";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  stock_qty: number;
  category: string | null;
}
interface Customer {
  id: string;
  full_name: string;
}

export function PosTerminal({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerId, setCustomerId] = useState<string>("");
  const [method, setMethod] = useState("Cash");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<{ saleNumber: string; total: number } | null>(null);
  const router = useRouter();

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const p = products.find((pr) => pr.id === id)!;
          return { product_id: id, name: p.name, quantity: qty, unit_price: Number(p.selling_price) };
        }),
    [cart, products]
  );

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  function addToCart(product: Product) {
    setCart((c) => {
      const current = c[product.id] ?? 0;
      if (current >= product.stock_qty) return c;
      return { ...c, [product.id]: current + 1 };
    });
  }

  function setQty(id: string, qty: number) {
    setCart((c) => ({ ...c, [id]: Math.max(0, qty) }));
  }

  function checkout() {
    startTransition(async () => {
      const result = await completeSale({ lines, customer_id: customerId || null, method });
      setReceipt(result);
      setCart({});
      setCustomerId("");
      router.refresh();
    });
  }

  if (receipt) {
    return (
      <div className="card p-8 max-w-md mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-success-soft text-success flex items-center justify-center text-2xl mx-auto mb-3">✓</div>
        <div className="font-display text-xl font-semibold text-ink mb-1">Sale Completed</div>
        <div className="text-sm text-ink-muted mb-4">{receipt.saleNumber}</div>
        <div className="text-3xl font-display font-semibold text-indigo mb-6">₵{receipt.total.toFixed(2)}</div>
        <button
          onClick={() => setReceipt(null)}
          className="w-full rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:opacity-90"
        >
          New Sale
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full mb-4 rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={(cart[p.id] ?? 0) >= p.stock_qty}
              className="card p-3.5 text-left hover:border-gold transition-colors disabled:opacity-40"
            >
              <div className="text-sm font-semibold text-ink line-clamp-2">{p.name}</div>
              <div className="text-xs text-ink-muted mt-1">{p.category ?? "—"}</div>
              <div className="text-sm font-bold text-indigo mt-2">₵{Number(p.selling_price).toFixed(2)}</div>
              <div className="text-[11px] text-ink-faint mt-0.5">{p.stock_qty} in stock</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full card p-10 text-center text-sm text-ink-muted">No products match your search.</div>
          )}
        </div>
      </div>

      <div>
        <div className="card p-4 sticky top-4">
          <div className="font-display font-semibold text-ink mb-3">Cart</div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin mb-4">
            {lines.length === 0 && <div className="text-sm text-ink-muted py-6 text-center">No items yet.</div>}
            {lines.map((l) => (
              <div key={l.product_id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">{l.name}</div>
                  <div className="text-xs text-ink-muted">₵{l.unit_price.toFixed(2)} each</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setQty(l.product_id, l.quantity - 1)}
                    className="w-6 h-6 rounded-sm border border-border-strong text-ink text-xs font-bold"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-xs font-semibold">{l.quantity}</span>
                  <button
                    onClick={() => setQty(l.product_id, l.quantity + 1)}
                    className="w-6 h-6 rounded-sm border border-border-strong text-ink text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 mb-3">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Customer (optional)</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Payment method</label>
            <div className="grid grid-cols-2 gap-1.5">
              {["Cash", "Mobile Money", "Bank Transfer", "Card"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`text-xs font-semibold rounded-sm px-2 py-1.5 border transition-colors ${
                    method === m ? "bg-sidebar-active text-white border-sidebar-active" : "border-border text-ink-muted"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm font-semibold mb-4">
            <span className="text-ink-muted">Total</span>
            <span className="text-xl font-display text-indigo">₵{total.toFixed(2)}</span>
          </div>

          <button
            onClick={checkout}
            disabled={lines.length === 0 || isPending}
            className="w-full rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Processing…" : "Complete Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}
