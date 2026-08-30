import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { StockButtons } from "./StockButtons";

export default async function FabricInventoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: fabrics } = await supabase
    .from("fabrics")
    .select("id, name, stock_yards")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("stock_yards", { ascending: true });

  const rows = (fabrics ?? []) as any[];
  const lowStock = rows.filter((f) => Number(f.stock_yards) <= 5).length;
  const totalYards = rows.reduce((s, f) => s + Number(f.stock_yards), 0);

  return (
    <div>
      <PageHead title="Fabric Inventory" subtitle="Stock movements and reorder thresholds by fabric." crumb="Fabrics / Fabric Inventory" actions={<Button href="/fabrics" variant="outline">Manage Fabrics</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Yards" value={totalYards} />
        <StatCard label="Fabrics" value={rows.length} />
        <StatCard label="Low Stock" value={lowStock} accent />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="▤" title="No fabric stock yet." description="Add fabrics to track their inventory here." actionLabel="New Fabric" actionHref="/fabrics/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Fabric" }, { key: "stock", label: "Stock (yards)" }, { key: "status", label: "Status" }, { key: "adjust", label: "Adjust" }]}
          rows={rows.map((f) => ({
            id: f.id,
            cells: {
              name: f.name,
              stock: f.stock_yards,
              status: <StatusBadge value={Number(f.stock_yards) <= 5 ? "Low Stock" : "Active"} />,
              adjust: <StockButtons fabricId={f.id} />,
            },
          }))}
        />
      )}
    </div>
  );
}
