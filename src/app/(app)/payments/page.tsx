import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

export default async function PaymentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, type, created_at, customers(full_name), custom_orders(order_number)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (payments ?? []) as any[];
  const total = rows.reduce((s, p) => s + Number(p.amount), 0);
  const today = rows
    .filter((p) => new Date(p.created_at).toDateString() === new Date().toDateString())
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <PageHead title="Customer Payments" subtitle={`${rows.length} recorded · deposits, balances and POS sale receipts`} crumb="Payments" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Collected Today" value={`₵${today.toFixed(2)}`} accent />
        <StatCard label="Total Collected" value={`₵${total.toFixed(2)}`} />
        <StatCard label="Transactions" value={rows.length} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="◉"
          title="No payments recorded yet."
          description="Payments recorded against orders or POS sales will appear here automatically."
        />
      ) : (
        <DataTable
          columns={[
            { key: "customer", label: "Customer" },
            { key: "ref", label: "Reference" },
            { key: "amount", label: "Amount" },
            { key: "method", label: "Method" },
            { key: "type", label: "Type" },
            { key: "date", label: "Date" },
          ]}
          rows={rows.map((p) => ({
            id: p.id,
            cells: {
              customer: p.customers?.full_name ?? "Walk-in",
              ref: p.custom_orders?.order_number ?? "POS Sale",
              amount: `₵${Number(p.amount).toFixed(2)}`,
              method: p.method,
              type: p.type,
              date: new Date(p.created_at).toLocaleDateString(),
            },
          }))}
        />
      )}
    </div>
  );
}
