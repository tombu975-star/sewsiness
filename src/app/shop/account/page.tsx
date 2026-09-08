import Link from "next/link";
import { requireShopCustomer } from "@/lib/auth/require-shop-customer";
import { SignOutButton } from "./SignOutButton";

export default async function CustomerAccountPage() {
  const { customer } = await requireShopCustomer();

  return (
    <div className="px-5 pb-8 pt-6">
      <h1 className="font-display text-lg font-semibold text-ink">Your account</h1>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-indigo text-lg font-semibold text-white">
          {customer.full_name
            .split(" ")
            .map((p: string) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{customer.full_name}</p>
          {customer.email && <p className="text-xs text-ink-muted">{customer.email}</p>}
          {customer.phone && <p className="text-xs text-ink-muted">{customer.phone}</p>}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Link href="/shop/orders" className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-medium text-ink">
          Your orders
          <span aria-hidden="true" className="text-ink-faint">›</span>
        </Link>
        <Link href="/shop/favourites" className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-medium text-ink">
          Favourite tailors
          <span aria-hidden="true" className="text-ink-faint">›</span>
        </Link>
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
