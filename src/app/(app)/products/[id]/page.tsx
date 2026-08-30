import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StockAdjuster } from "./StockAdjuster";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", params.id).single();
  if (!product) notFound();

  const { data: salesItems } = await supabase
    .from("pos_sale_items")
    .select("id, quantity, unit_price, line_total, pos_sales(sale_number, created_at)")
    .eq("product_id", params.id)
    .order("id", { ascending: false })
    .limit(10);

  return (
    <div>
      <PageHead
        title={product.name}
        subtitle={`Product record · Products`}
        crumb={`Products / ${product.name}`}
        actions={
          <Button href="/products" variant="outline">
            ← Back to Products
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Category" value={product.category ?? "—"} />
        <StatCard label="Price" value={`₵${Number(product.selling_price).toFixed(2)}`} />
        <StatCard label="Stock" value={product.stock_qty} />
        <StatCard
          label="Status"
          value={<StatusBadge value={product.status} />}
        />
      </div>

      <div className="card p-5 mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">Adjust stock</div>
          <div className="text-xs text-ink-muted">Status recalculates automatically from the new quantity.</div>
        </div>
        <StockAdjuster productId={product.id} />
      </div>

      <h2 className="font-display text-lg font-semibold text-ink mb-3">Recent Sales</h2>
      <DataTable
        columns={[
          { key: "sale", label: "Sale #" },
          { key: "qty", label: "Qty" },
          { key: "price", label: "Unit Price" },
          { key: "total", label: "Line Total" },
          { key: "date", label: "Date" },
        ]}
        rows={(salesItems ?? []).map((s: any) => ({
          id: s.id,
          cells: {
            sale: s.pos_sales?.sale_number ?? "—",
            qty: s.quantity,
            price: `₵${Number(s.unit_price).toFixed(2)}`,
            total: `₵${Number(s.line_total).toFixed(2)}`,
            date: s.pos_sales?.created_at ? new Date(s.pos_sales.created_at).toLocaleDateString() : "—",
          },
        }))}
        emptyLabel="No sales recorded for this product yet."
      />
    </div>
  );
}
