import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createProduct } from "../actions";

export default function NewProductPage() {
  return (
    <div>
      <PageHead title="New Product" subtitle="This product will be immediately sellable through POS." crumb="Products / New" />
      <form action={createProduct} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Product name</label>
          <input
            name="name"
            required
            placeholder="e.g. Women's Ready Blouse"
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Category</label>
            <input
              name="category"
              placeholder="e.g. Ready-to-wear"
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">SKU</label>
            <input
              name="sku"
              placeholder="Optional"
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Brand</label>
            <input
              name="brand"
              placeholder="Optional"
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Selling price (₵)</label>
            <input
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Cost price (₵)</label>
            <input
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Stock qty</label>
            <input
              name="stock_qty"
              type="number"
              min="0"
              defaultValue={0}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/products" variant="ghost">
            Cancel
          </Button>
          <SubmitButton pendingLabel="Saving…">Save Product</SubmitButton>
        </div>
      </form>
    </div>
  );
}
