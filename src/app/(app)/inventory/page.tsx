import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function InventoryPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, stock_qty, status")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("stock_qty", { ascending: true });

  const rows = (products ?? []) as any[];
  const lowStock = rows.filter((p) => p.status === "Low Stock").length;
  const outOfStock = rows.filter((p) => p.status === "Out of Stock").length;
  const totalUnits = rows.reduce((s, p) => s + Number(p.stock_qty), 0);

  return (
    <div>
      <PageHead title="Inventory" subtitle="Stock levels across all products, with low-stock alerts." crumb="Products / Inventory" actions={<Button href="/products" variant="outline">Manage Products</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Units" value={totalUnits} />
        <StatCard label="Products" value={rows.length} />
        <StatCard label="Low Stock" value={lowStock} accent />
        <StatCard label="Out of Stock" value={outOfStock} accent />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="⛝" title="No products yet." description="Add products to start tracking inventory." actionLabel="New Product" actionHref="/products/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Product" }, { key: "category", label: "Category" }, { key: "stock", label: "Stock" }, { key: "status", label: "Status", isStatus: true }]}
          rows={rows.map((p) => ({ id: p.id, href: `/products/${p.id}`, cells: { name: p.name, category: p.category ?? "—", stock: p.stock_qty, status: p.status } }))}
        />
      )}
    </div>
  );
}
