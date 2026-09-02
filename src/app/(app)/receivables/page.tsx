import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function ReceivablesPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: orders } = await supabase
    .from("custom_orders")
    .select("id, order_number, total_amount, amount_paid, due_date, status, customers(full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .neq("status", "Cancelled")
    .order("due_date", { ascending: true });

  const rows = (orders ?? []).filter((o: any) => Number(o.total_amount) - Number(o.amount_paid) > 0) as any[];
  const total = rows.reduce((s, o) => s + (Number(o.total_amount) - Number(o.amount_paid)), 0);
  const overdue = rows.filter((o) => o.due_date && new Date(o.due_date) < new Date());

  return (
    <div>
      <PageHead title="Receivables" subtitle={`${rows.length} orders with an outstanding balance`} crumb="Payments / Receivables" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Outstanding" value={`₵${total.toFixed(2)}`} accent />
        <StatCard label="Orders" value={rows.length} />
        <StatCard label="Overdue" value={overdue.length} accent />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="◔" title="Nothing outstanding." description="Every order is fully paid — great collections work." />
      ) : (
        <DataTable
          columns={[{ key: "order", label: "Order" }, { key: "customer", label: "Customer" }, { key: "balance", label: "Balance" }, { key: "due", label: "Due" }, { key: "status", label: "Status", isStatus: true }]}
          rows={rows.map((o: any) => ({
            id: o.id,
            href: `/orders/${o.id}`,
            cells: { order: o.order_number, customer: o.customers?.full_name ?? "—", balance: `₵${(Number(o.total_amount) - Number(o.amount_paid)).toFixed(2)}`, due: o.due_date ?? "—", status: o.due_date && new Date(o.due_date) < new Date() ? "Overdue" : o.status },
          }))}
        />
      )}
    </div>
  );
}
