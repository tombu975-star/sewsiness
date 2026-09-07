import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createProduct } from "../actions";

export default function NewProductPage() {
  return (
    <div>
      <PageHead title="New Product" subtitle="This product will be immediately sellable through POS." crumb="Products / New" />
      <form action={createProduct} className="card p-5 sm:p-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="product-name" className="field-label">Product name<span className="text-danger ml-1" aria-hidden="true">*</span></label>
          <input
            id="product-name"
            name="name"
            required
            maxLength={120}
            placeholder="e.g. Women's Ready Blouse"
            className="field-input"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="product-category" className="field-label">Category</label>
            <input
              id="product-category"
              name="category"
              placeholder="e.g. Ready-to-wear"
              maxLength={120}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="product-sku" className="field-label">SKU</label>
            <input
              id="product-sku"
              name="sku"
              placeholder="Optional"
              maxLength={80}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="product-brand" className="field-label">Brand</label>
            <input
              id="product-brand"
              name="brand"
              placeholder="Optional"
              maxLength={120}
              className="field-input"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="selling-price" className="field-label">Selling price (₵)<span className="text-danger ml-1" aria-hidden="true">*</span></label>
            <input
              id="selling-price"
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              required
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="cost-price" className="field-label">Cost price (₵)</label>
            <input
              id="cost-price"
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="stock-qty" className="field-label">Stock qty</label>
            <input
              id="stock-qty"
              name="stock_qty"
              type="number"
              min="0"
              defaultValue={0}
              className="field-input"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
          <Button href="/products" variant="ghost">
            Cancel
          </Button>
          <SubmitButton pendingLabel="Saving…">Save Product</SubmitButton>
        </div>
      </form>
    </div>
  );
}
