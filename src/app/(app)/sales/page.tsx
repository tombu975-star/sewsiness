import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function SalesPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: sales } = await supabase
    .from("pos_sales")
    .select("id, sale_number, total, status, created_at, customers(full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (sales ?? []) as any[];
  const total = rows.reduce((s, r) => s + Number(r.total), 0);
  const today = rows.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString()).reduce((s, r) => s + Number(r.total), 0);

  return (
    <div>
      <PageHead title="Sales" subtitle={`${rows.length} transactions · aggregated POS sales history`} crumb="POS & Sales" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Today" value={`₵${today.toFixed(2)}`} accent />
        <StatCard label="All Time" value={`₵${total.toFixed(2)}`} />
        <StatCard label="Transactions" value={rows.length} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="◧" title="No sales yet." description="Sales rung up through POS will appear here automatically." />
      ) : (
        <DataTable
          columns={[{ key: "sale", label: "Sale #" }, { key: "customer", label: "Customer" }, { key: "total", label: "Total" }, { key: "status", label: "Status", isStatus: true }, { key: "date", label: "Date" }]}
          rows={rows.map((s) => ({ id: s.id, cells: { sale: s.sale_number, customer: s.customers?.full_name ?? "Walk-in", total: `₵${Number(s.total).toFixed(2)}`, status: s.status, date: new Date(s.created_at).toLocaleString() } }))}
        />
      )}
    </div>
  );
}
