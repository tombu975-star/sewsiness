import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function ProductCategoriesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: products } = await supabase.from("products").select("category, stock_qty").eq("organization_id", profile?.organization_id ?? "");
  const byCategory = (products ?? []).reduce((acc: Record<string, { count: number; stock: number }>, p: any) => {
    const key = p.category || "Uncategorized";
    acc[key] ??= { count: 0, stock: 0 };
    acc[key].count += 1;
    acc[key].stock += Number(p.stock_qty);
    return acc;
  }, {});
  const rows = Object.entries(byCategory);

  return (
    <div>
      <PageHead title="Categories" subtitle="Products grouped by category. Set a product's category from its edit page." crumb="Products / Categories" actions={<Button href="/products/new">+ New Product</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="◫" title="No categories yet." description="Categories appear automatically once products are tagged." actionLabel="New Product" actionHref="/products/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Category" }, { key: "count", label: "Products" }, { key: "stock", label: "Total Stock" }]}
          rows={rows.map(([name, v]) => ({ id: name, cells: { name, count: v.count, stock: v.stock } }))}
        />
      )}
    </div>
  );
}
