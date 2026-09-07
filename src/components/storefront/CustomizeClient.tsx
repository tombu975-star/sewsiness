"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StorefrontProduct } from "@/lib/storefront/demo-data";
import { useCart } from "@/lib/storefront/cart-context";
import { Button } from "@/components/Button";

export function CustomizeClient({ product }: { product: StorefrontProduct }) {
  const router = useRouter();
  const { addLine } = useCart();

  const [colorId, setColorId] = useState(product.colors[0].id);
  const [selections, setSelections] = useState<Record<string, string>>(
    Object.fromEntries(product.attributes.map((a) => [a.id, a.options[0]]))
  );
  const [activeAttribute, setActiveAttribute] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [added, setAdded] = useState(false);

  const activeColor = useMemo(
    () => product.colors.find((c) => c.id === colorId) ?? product.colors[0],
    [product.colors, colorId]
  );

  function selectOption(attributeId: string, option: string) {
    setSelections((prev) => ({ ...prev, [attributeId]: option }));
  }

  function handleAddToCart(andOrder: boolean) {
    addLine({
      productId: product.id,
      productName: product.name,
      tailorName: product.tailorName,
      price: product.price,
      imageUrl: "",
      selections: { color: activeColor.label, ...selections },
      quantity: 1,
    });
    if (andOrder) {
      router.push("/shop/cart");
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  }

  return (
    <div className="px-5 pb-8 pt-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-sunken text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-display text-base font-semibold text-ink">Customize your shirt</h1>
      </div>

      {/* Garment preview — a hand-drawn shirt illustration whose fill follows
          the selected color, since a real 3D/GLB viewer is a separate
          front-end investment beyond this pass. */}
      <button
        onClick={() => {
          setSpinning(true);
          setTimeout(() => setSpinning(false), 700);
        }}
        className="relative mx-auto mt-6 flex h-56 w-56 items-center justify-center rounded-full bg-sunken"
      >
        <svg
          viewBox="0 0 200 200"
          className={`h-40 w-40 transition-transform duration-700 ${spinning ? "rotate-[360deg]" : ""}`}
        >
          <path
            d="M70 30 L60 50 L40 62 L55 82 L55 175 L145 175 L145 82 L160 62 L140 50 L130 30 Q100 46 70 30 Z"
            fill={activeColor.hex}
          />
          <path d="M100 46 L92 60 L100 74 L108 60 Z" fill="white" opacity="0.9" />
          <line x1="100" y1="74" x2="100" y2="150" stroke="white" strokeOpacity="0.25" strokeWidth="2" />
        </svg>
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-faint">Tap the shirt to preview a turn</p>

      <div className="mt-5 flex items-center justify-between">
        <p className="font-display text-xl font-semibold text-ink">${product.price.toFixed(2)}</p>
        <button
          onClick={() => {
            setSpinning(true);
            setTimeout(() => setSpinning(false), 700);
          }}
          className="rounded-full bg-indigo-soft px-4 py-2 text-xs font-semibold text-indigo"
        >
          View in 3D
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {product.colors.map((c) => (
          <button
            key={c.id}
            onClick={() => setColorId(c.id)}
            aria-label={c.label}
            className="h-6 w-6 rounded-full ring-offset-2"
            style={{
              background: c.hex,
              boxShadow: c.id === colorId ? `0 0 0 2px ${c.hex}` : "none",
              outline: c.id === colorId ? `2px solid ${c.hex}` : "none",
              outlineOffset: 2,
            }}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2 text-center">
        {product.attributes.map((attr) => (
          <button
            key={attr.id}
            onClick={() => setActiveAttribute(activeAttribute === attr.id ? null : attr.id)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-medium ${
              activeAttribute === attr.id ? "border-indigo bg-indigo-soft text-indigo" : "border-border text-ink-muted"
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sunken text-ink">
              <AttrIcon id={attr.id} />
            </span>
            {attr.label}
          </button>
        ))}
      </div>

      {activeAttribute && (
        <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-sunken p-3">
          {product.attributes
            .find((a) => a.id === activeAttribute)!
            .options.map((opt) => (
              <button
                key={opt}
                onClick={() => selectOption(activeAttribute, opt)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  selections[activeAttribute] === opt ? "bg-indigo text-white" : "bg-surface text-ink-muted"
                }`}
              >
                {opt}
              </button>
            ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" className="w-full">
          Upload Design
        </Button>
        <Button variant="outline" className="w-full">
          Call Tailor
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button variant="outline" className="w-full" onClick={() => handleAddToCart(false)}>
          {added ? "Added ✓" : "Add to card"}
        </Button>
        <Button className="w-full" onClick={() => handleAddToCart(true)}>
          Order
        </Button>
      </div>
    </div>
  );
}

function AttrIcon({ id }: { id: string }) {
  if (id === "sleeves") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 8 9 5v6l-3 2Z" strokeLinejoin="round" />
        <path d="M20 8 15 5v6l3 2Z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "pocket") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="7" y="9" width="10" height="8" rx="1.5" />
      </svg>
    );
  }
  if (id === "placket") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="4" x2="12" y2="20" strokeLinecap="round" />
        <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="9" y1="4" x2="9" y2="20" strokeLinecap="round" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
