import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function ProductBrandsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: products } = await supabase.from("products").select("brand, stock_qty").eq("organization_id", profile?.organization_id ?? "");
  const byBrand = (products ?? []).reduce((acc: Record<string, { count: number; stock: number }>, p: any) => {
    const key = p.brand || "Unbranded";
    acc[key] ??= { count: 0, stock: 0 };
    acc[key].count += 1;
    acc[key].stock += Number(p.stock_qty);
    return acc;
  }, {});
  const rows = Object.entries(byBrand);

  return (
    <div>
      <PageHead title="Brands" subtitle="Products grouped by brand. Set a product's brand from its edit page." crumb="Products / Brands" actions={<Button href="/products/new">+ New Product</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="◫" title="No brands yet." description="Brands appear automatically once products are tagged." actionLabel="New Product" actionHref="/products/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Brand" }, { key: "count", label: "Products" }, { key: "stock", label: "Total Stock" }]}
          rows={rows.map(([name, v]) => ({ id: name, cells: { name, count: v.count, stock: v.stock } }))}
        />
      )}
    </div>
  );
}
