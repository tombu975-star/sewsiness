import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function ProductVariantsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, size, color, stock_qty, products(name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("id", { ascending: false });

  const rows = (variants ?? []) as any[];

  return (
    <div>
      <PageHead title="Variants" subtitle={`${rows.length} · size, colour and style variants per product`} crumb="Products / Variants" actions={<Button href="/product-variants/new">+ New Variant</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="◫" title="No variants yet." description="Add size/colour variants for products that need them." actionLabel="New Variant" actionHref="/product-variants/new" />
      ) : (
        <DataTable
          columns={[{ key: "product", label: "Product" }, { key: "size", label: "Size" }, { key: "color", label: "Color" }, { key: "stock", label: "Stock" }]}
          rows={rows.map((v) => ({ id: v.id, cells: { product: v.products?.name ?? "—", size: v.size ?? "—", color: v.color ?? "—", stock: v.stock_qty } }))}
        />
      )}
    </div>
  );
}
