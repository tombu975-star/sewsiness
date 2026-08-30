import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

export default async function QualityControlPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: checks } = await supabase
    .from("quality_checks")
    .select("id, passed, notes, created_at, custom_orders(id, order_number, garment)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (checks ?? []) as any[];
  const passRate = rows.length ? Math.round((rows.filter((r) => r.passed).length / rows.length) * 100) : 0;

  return (
    <div>
      <PageHead title="Quality Control" subtitle="Sign-off checklist run against each order before it ships." crumb="Quality Control" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Checks Run" value={rows.length} />
        <StatCard label="Pass Rate" value={`${passRate}%`} accent />
        <StatCard label="Failed" value={rows.filter((r) => !r.passed).length} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="✓" title="No QC checks yet." description="Run a quality check from an order's detail page before marking it Completed." />
      ) : (
        <DataTable
          columns={[{ key: "order", label: "Order" }, { key: "garment", label: "Garment" }, { key: "result", label: "Result", isStatus: true }, { key: "date", label: "Date" }]}
          rows={rows.map((c) => ({
            id: c.id,
            href: `/orders/${c.custom_orders?.id}`,
            cells: { order: c.custom_orders?.order_number ?? "—", garment: c.custom_orders?.garment ?? "—", result: c.passed ? "Passed" : "Failed", date: new Date(c.created_at).toLocaleDateString() },
          }))}
        />
      )}
    </div>
  );
}
