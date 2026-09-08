import type { Metadata } from "next";
import { CartProvider } from "@/lib/storefront/cart-context";
import { ShopBottomNav } from "@/components/storefront/ShopBottomNav";

export const metadata: Metadata = {
  title: "Sewsiness — Tailor-made clothing",
  description: "Browse tailors, customize your garment, and order.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-canvas pb-20">
        <div className="mx-auto max-w-md sm:max-w-2xl sm:px-6 md:max-w-4xl lg:max-w-5xl">{children}</div>
        <ShopBottomNav />
      </div>
    </CartProvider>
  );
}
