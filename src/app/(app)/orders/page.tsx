import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function OrdersPage() {
  await requirePageRole(["owner", "manager", "staff"]);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: orders } = await supabase
    .from("custom_orders")
    .select("id, order_number, garment, due_date, total_amount, amount_paid, status, customers(full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (orders ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Custom Orders"
        subtitle={`${rows.length} active · the spine of the whole workflow: Customer → Order → Costing → Payment → Production → Fitting → Delivery`}
        crumb="Dressmaking / Custom Orders"
        actions={<Button href="/orders/new">+ New Order</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="✂"
          title="No orders yet."
          description="Create your first custom order — measurements, design, costing and production all flow from here."
          actionLabel="New Order"
          actionHref="/orders/new"
        />
      ) : (
        <DataTable
          columns={[
            { key: "order", label: "Order" },
            { key: "customer", label: "Customer" },
            { key: "garment", label: "Garment" },
            { key: "due", label: "Due Date" },
            { key: "balance", label: "Balance" },
            { key: "status", label: "Status", isStatus: true },
          ]}
          searchKeys={["order", "customer", "garment"]}
          searchPlaceholder="Search orders, customers, garments…"
          filterKey="status"
          // Fixed to the real check constraint (see
          // 041_order_status_novice_terms.sql) rather than derived from
          // today's rows, so a tab for e.g. "Cancelled" is still there
          // (just empty) instead of disappearing the moment there
          // happen to be zero orders in that state right now.
          filterOptions={["New", "Confirmed", "In Production", "Ready", "Delivered", "Cancelled"]}
          rows={rows.map((o) => ({
            id: o.id,
            href: `/orders/${o.id}`,
            cells: {
              order: o.order_number,
              customer: o.customers?.full_name ?? "—",
              garment: o.garment,
              due: o.due_date ?? "—",
              balance: `₵${(Number(o.total_amount) - Number(o.amount_paid)).toFixed(2)}`,
              status: o.status,
            },
          }))}
        />
      )}
    </div>
  );
}
