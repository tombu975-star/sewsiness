import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function ProductsPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, selling_price, stock_qty, status")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (products ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Products"
        subtitle={`${rows.length} total · ready-to-wear and accessory catalogue, sold through POS`}
        crumb="Products"
        actions={<Button href="/products/new">+ New Product</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="⛝"
          title="No products yet."
          description="Add your first product to start selling through POS and tracking inventory."
          actionLabel="New Product"
          actionHref="/products/new"
        />
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Product" },
            { key: "category", label: "Category" },
            { key: "price", label: "Price" },
            { key: "stock", label: "Stock" },
            { key: "status", label: "Status", isStatus: true },
          ]}
          rows={rows.map((p) => ({
            id: p.id,
            href: `/products/${p.id}`,
            cells: {
              name: p.name,
              category: p.category ?? "—",
              price: `₵${Number(p.selling_price).toFixed(2)}`,
              stock: p.stock_qty,
              status: p.status,
            },
          }))}
        />
      )}
    </div>
  );
}
