import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

export default async function CostingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();

  if (!["owner", "manager", "super_admin"].includes(profile?.role ?? "")) {
    return (
      <div>
        <PageHead title="Costing" crumb="Costing" />
        <div className="card p-10 text-center text-sm text-ink-muted">
          Costing is restricted to Owner, Manager and Super Admin.
        </div>
      </div>
    );
  }

  const { data: costs } = await supabase
    .from("order_costs")
    .select("order_id, fabric_cost, labor_cost, overhead_cost, other_cost, custom_orders(order_number, garment, total_amount)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("updated_at", { ascending: false });

  const rows = (costs ?? []) as any[];
  const totalMargin = rows.reduce((s, c) => {
    const cost = Number(c.fabric_cost) + Number(c.labor_cost) + Number(c.overhead_cost) + Number(c.other_cost);
    return s + (Number(c.custom_orders?.total_amount ?? 0) - cost);
  }, 0);

  return (
    <div>
      <PageHead title="Costing" subtitle="True cost and margin per order — visible only to Owner, Manager and Super Admin." crumb="Costing" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Orders Costed" value={rows.length} />
        <StatCard label="Total Margin" value={`₵${totalMargin.toFixed(2)}`} accent />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="⌗" title="No costing entered yet." description="Enter costing from an individual order's detail page." />
      ) : (
        <DataTable
          columns={[{ key: "order", label: "Order" }, { key: "revenue", label: "Revenue" }, { key: "cost", label: "Cost" }, { key: "margin", label: "Margin" }]}
          rows={rows.map((c) => {
            const cost = Number(c.fabric_cost) + Number(c.labor_cost) + Number(c.overhead_cost) + Number(c.other_cost);
            const revenue = Number(c.custom_orders?.total_amount ?? 0);
            return {
              id: c.order_id,
              href: `/orders/${c.order_id}`,
              cells: { order: c.custom_orders?.order_number ?? "—", revenue: `₵${revenue.toFixed(2)}`, cost: `₵${cost.toFixed(2)}`, margin: `₵${(revenue - cost).toFixed(2)}` },
            };
          })}
        />
      )}
    </div>
  );
}
