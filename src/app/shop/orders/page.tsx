import Link from "next/link";
import { requireShopCustomer } from "@/lib/auth/require-shop-customer";
import { createClient } from "@/lib/supabase/server";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";

export default async function CustomerOrdersPage() {
  await requireShopCustomer();
  const supabase = createClient();

  // Relies on the "shop customers can read own orders" RLS policy —
  // this only ever returns orders whose linked customers row belongs
  // to the signed-in shopper, at any atelier.
  const { data: orders } = await supabase
    .from("custom_orders")
    .select("id, order_number, garment, status, due_date, total_amount, amount_paid, organizations(name)")
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center px-5 pb-8 pt-24 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-ink-faint">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 3h12v18l-6-3-6 3V3Z" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-4 text-sm font-medium text-ink">No orders yet</p>
        <p className="mt-1 text-xs text-ink-muted">Orders you place will show up here so you can track them.</p>
        <Link href="/shop/home" className="mt-3 text-sm font-semibold text-indigo">
          Browse designs
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-6">
      <h1 className="font-display text-lg font-semibold text-ink">Your orders</h1>
      <div className="mt-5 flex flex-col gap-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">{order.garment}</p>
                <p className="text-xs text-ink-muted">{(order.organizations as any)?.name ?? "—"} · #{order.order_number}</p>
              </div>
              <span className="whitespace-nowrap rounded-full bg-indigo-soft px-2.5 py-1 text-[11px] font-semibold text-indigo">{order.status}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <PaymentStatusBadge total={Number(order.total_amount)} paid={Number(order.amount_paid)} />
              {order.due_date && <span className="text-xs text-ink-muted">Due {new Date(order.due_date as string).toLocaleDateString()}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
