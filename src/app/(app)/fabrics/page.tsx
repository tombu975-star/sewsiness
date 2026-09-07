import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function FabricsPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: fabrics } = await supabase
    .from("fabrics")
    .select("id, name, type, color, price_per_yard, stock_yards")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("name");

  const rows = (fabrics ?? []) as any[];

  return (
    <div>
      <PageHead title="Shop Fabrics" subtitle={`${rows.length} in stock · fabric the business owns and sells into orders`} crumb="Fabrics / Shop Fabrics" actions={<Button href="/fabrics/new">+ New Fabric</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="▤" title="No fabrics yet." description="Add fabric stock to start pulling it into orders and costing." actionLabel="New Fabric" actionHref="/fabrics/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Fabric" }, { key: "type", label: "Type" }, { key: "color", label: "Color" }, { key: "price", label: "₵ / yard" }, { key: "stock", label: "Stock" }]}
          rows={rows.map((f) => ({
            id: f.id,
            cells: {
              name: f.name,
              type: f.type ?? "—",
              color: f.color ?? "—",
              price: `₵${Number(f.price_per_yard).toFixed(2)}`,
              stock: (
                <span className="flex items-center gap-2">
                  {f.stock_yards} yd
                  {Number(f.stock_yards) <= 5 && <StatusBadge value="Low Stock" />}
                </span>
              ),
            },
          }))}
        />
      )}
    </div>
  );
}
