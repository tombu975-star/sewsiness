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

// Cycled across product tiles purely for visual variety — same five-tone
// gradient system used everywhere else (StatCard, dashboard quick
// actions), so the POS grid feels colorful without inventing new colors.
const TONES = [
  { grad: "var(--grad-brand)", glow: "var(--glow-brand)" },
  { grad: "var(--grad-teal)", glow: "var(--glow-teal)" },
  { grad: "var(--grad-rose)", glow: "var(--glow-rose)" },
  { grad: "var(--grad-amber)", glow: "var(--glow-amber)" },
  { grad: "var(--grad-blue)", glow: "var(--glow-blue)" },
];
function toneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

export function PosTerminal({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerId, setCustomerId] = useState<string>("");
  const [method, setMethod] = useState("Cash");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<{ saleNumber: string; total: number } | null>(null);
  // Product id that was just tapped, for a brief "added" flash on its
  // tile — pure visual feedback, cleared after the animation finishes.
  const [justAdded, setJustAdded] = useState<string | null>(null);
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
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

  function addToCart(product: Product) {
    setCart((c) => {
      const current = c[product.id] ?? 0;
      if (current >= product.stock_qty) return c;
      return { ...c, [product.id]: current + 1 };
    });
    setJustAdded(product.id);
    window.setTimeout(() => setJustAdded((id) => (id === product.id ? null : id)), 420);
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
      <div className="card p-8 max-w-md mx-auto text-center animate-fade-up">
        <div
          className="w-16 h-16 rounded-full text-white flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ backgroundImage: "var(--grad-teal)", boxShadow: "var(--glow-teal)" }}
        >
          ✓
        </div>
        <div className="font-display text-xl font-semibold text-ink mb-1">Sale Completed</div>
        <div className="text-sm text-ink-muted mb-4 font-mono">{receipt.saleNumber}</div>
        <div className="text-3xl font-display font-semibold text-gradient-brand mb-6">₵{receipt.total.toFixed(2)}</div>
        <button
          onClick={() => setReceipt(null)}
          className="btn-shine w-full rounded-full text-white font-semibold text-sm py-2.5 transition-all active:scale-[0.98]"
          style={{ backgroundImage: "var(--grad-brand)", boxShadow: "var(--glow-brand)" }}
        >
          New Sale
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint text-sm pointer-events-none">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 rounded-full border border-border bg-surface py-2.5 text-sm text-ink outline-none focus:border-indigo2 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const tone = toneFor(p.id);
            const outOfRoom = (cart[p.id] ?? 0) >= p.stock_qty;
            const lowStock = p.stock_qty > 0 && p.stock_qty <= 3;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={outOfRoom}
                className={`card card-hover card-glow p-3.5 text-left transition-all disabled:opacity-40 disabled:hover:translate-y-0 active:scale-[0.97] ${
                  justAdded === p.id ? "ring-2 ring-offset-1" : ""
                }`}
                style={justAdded === p.id ? ({ "--tw-ring-color": "var(--indigo2)" } as React.CSSProperties) : undefined}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundImage: tone.grad, boxShadow: tone.glow }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  {p.stock_qty === 0 ? (
                    <span className="badge bg-danger-soft text-danger flex-shrink-0">Out</span>
                  ) : lowStock ? (
                    <span className="badge bg-warning-soft text-warning flex-shrink-0">
                      <span className="w-[5px] h-[5px] rounded-full mr-1 flex-shrink-0 animate-pulse-dot" style={{ background: "var(--warning)", color: "var(--warning)" }} />
                      {p.stock_qty} left
                    </span>
                  ) : null}
                </div>
                <div className="text-sm font-semibold text-ink line-clamp-2">{p.name}</div>
                <div className="text-xs text-ink-muted mt-1">{p.category ?? "—"}</div>
                <div className="text-sm font-bold text-gradient-brand mt-2">₵{Number(p.selling_price).toFixed(2)}</div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full card p-10 text-center text-sm text-ink-muted">No products match your search.</div>
          )}
        </div>
      </div>

      <div>
        <div className="card card-glow p-4 sticky top-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-semibold text-ink">Cart</div>
            {itemCount > 0 && (
              <span
                className="text-[11px] font-bold text-white rounded-full px-2 py-0.5"
                style={{ backgroundImage: "var(--grad-brand)" }}
              >
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin mb-4">
            {lines.length === 0 && <div className="text-sm text-ink-muted py-6 text-center">No items yet.</div>}
            {lines.map((l) => (
              <div key={l.product_id} className="flex items-center justify-between gap-2 text-sm animate-fade-up">
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">{l.name}</div>
                  <div className="text-xs text-ink-muted">₵{l.unit_price.toFixed(2)} each</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setQty(l.product_id, l.quantity - 1)}
                    aria-label={`Decrease ${l.name} quantity`}
                    className="w-6 h-6 rounded-full border border-border-strong text-ink text-xs font-bold hover:bg-sunken transition-colors active:scale-90"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-xs font-semibold font-mono">{l.quantity}</span>
                  <button
                    onClick={() => setQty(l.product_id, l.quantity + 1)}
                    aria-label={`Increase ${l.name} quantity`}
                    className="w-6 h-6 rounded-full text-white text-xs font-bold transition-transform active:scale-90"
                    style={{ backgroundImage: "var(--grad-brand)" }}
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
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-indigo2 transition-colors"
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
                  aria-pressed={method === m}
                  className={`text-xs font-semibold rounded-full px-2 py-1.5 border transition-all ${
                    method === m ? "text-white border-transparent scale-[1.02]" : "border-border text-ink-muted hover:border-border-strong"
                  }`}
                  style={method === m ? { backgroundImage: "var(--grad-brand)", boxShadow: "var(--glow-brand)" } : undefined}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm font-semibold mb-4">
            <span className="text-ink-muted">Total</span>
            <span className="text-xl font-display text-gradient-brand">₵{total.toFixed(2)}</span>
          </div>

          <button
            onClick={checkout}
            disabled={lines.length === 0 || isPending}
            className="btn-shine w-full rounded-full text-white font-semibold text-sm py-2.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            style={{ backgroundImage: "var(--grad-brand)", boxShadow: "var(--glow-brand)" }}
          >
            {isPending ? "Processing…" : "Complete Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}
