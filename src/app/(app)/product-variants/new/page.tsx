import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createVariant } from "../actions";

export default async function NewVariantPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const { data: products } = await supabase.from("products").select("id, name").eq("organization_id", profile?.organization_id ?? "").order("name");

  return (
    <div>
      <PageHead title="New Variant" crumb="Products / Variants / New" />
      <form action={createVariant} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Product</label>
          <select name="product_id" required className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="" disabled selected>Select a product…</option>
            {(products ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Size</label>
            <input name="size" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Color</label>
            <input name="color" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Stock</label>
            <input name="stock_qty" type="number" min="0" defaultValue={0} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/product-variants" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Variant</SubmitButton>
        </div>
      </form>
    </div>
  );
}
