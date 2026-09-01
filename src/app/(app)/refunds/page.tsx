import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function RefundsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: refunds } = await supabase
    .from("payments")
    .select("id, amount, method, notes, created_at, customers(full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .eq("type", "Refund")
    .order("created_at", { ascending: false });

  const rows = (refunds ?? []) as any[];
  const total = rows.reduce((s, r) => s + Math.abs(Number(r.amount)), 0);

  return (
    <div>
      <PageHead title="Refunds" subtitle={`${rows.length} issued · refunds against orders or POS sales`} crumb="Payments / Refunds" actions={<Button href="/refunds/new">+ Issue Refund</Button>} />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Total Refunded" value={`₵${total.toFixed(2)}`} accent />
        <StatCard label="Refunds" value={rows.length} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="↺" title="No refunds issued." description="Refunds you issue against orders or POS sales will appear here." actionLabel="Issue Refund" actionHref="/refunds/new" />
      ) : (
        <DataTable
          columns={[{ key: "customer", label: "Customer" }, { key: "amount", label: "Amount" }, { key: "method", label: "Method" }, { key: "reason", label: "Reason" }, { key: "date", label: "Date" }]}
          rows={rows.map((r) => ({ id: r.id, cells: { customer: r.customers?.full_name ?? "Walk-in", amount: `₵${Math.abs(Number(r.amount)).toFixed(2)}`, method: r.method, reason: r.notes ?? "—", date: new Date(r.created_at).toLocaleDateString() } }))}
        />
      )}
    </div>
  );
}
