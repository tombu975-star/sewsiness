"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface CartLine {
  id: string;
  productId: string;
  productName: string;
  tailorName: string;
  price: number;
  imageUrl: string;
  selections: Record<string, string>;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addLine: (line: Omit<CartLine, "id">) => void;
  removeLine: (id: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addLine = useCallback((line: Omit<CartLine, "id">) => {
    setLines((prev) => [...prev, { ...line, id: `${line.productId}-${Date.now()}` }]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({ lines, count, subtotal, addLine, removeLine }),
    [lines, count, subtotal, addLine, removeLine]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
