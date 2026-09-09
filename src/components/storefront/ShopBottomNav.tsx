"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/storefront/cart-context";

const TABS = [
  { href: "/shop/home", label: "Home", icon: HomeIcon },
  { href: "/shop/explore", label: "Explore", icon: ExploreIcon },
  { href: "/shop/favourites", label: "Favourite", icon: HeartIcon },
  { href: "/shop/cart", label: "Cart", icon: CartIcon },
  { href: "/shop/orders", label: "Orders", icon: OrdersIcon },
];

export function ShopBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-md items-center justify-between sm:max-w-2xl sm:px-6 md:max-w-4xl lg:max-w-5xl">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium"
            >
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
                  active ? "scale-110 text-white" : "text-ink-faint"
                }`}
                style={active ? { backgroundImage: "var(--grad-brand)", boxShadow: "var(--glow-brand)" } : undefined}
              >
                <Icon />
                {tab.href === "/shop/cart" && count > 0 && (
                  <span
                    className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                    style={{ backgroundImage: "var(--grad-rose)", boxShadow: "var(--glow-rose)" }}
                  >
                    {count}
                  </span>
                )}
              </span>
              <span className={active ? "font-semibold text-gradient-brand" : "text-ink-faint"}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ExploreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15 9-4.5 1.5L9 15l4.5-1.5L15 9Z" strokeLinejoin="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 20.5s-7.5-4.6-9.6-9.2C1.1 8 2.6 4.8 5.9 4.1c2-.4 3.8.5 4.9 2.1a5 5 0 0 1 1.2 1.6 5 5 0 0 1 1.2-1.6c1.1-1.6 2.9-2.5 4.9-2.1 3.3.7 4.8 3.9 3.5 7.2C19.5 15.9 12 20.5 12 20.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <path d="M3 4h2l1.6 10.2a2 2 0 0 0 2 1.8h8.4a2 2 0 0 0 2-1.6L20.5 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12v18l-6-3-6 3V3Z" strokeLinejoin="round" />
    </svg>
  );
}
