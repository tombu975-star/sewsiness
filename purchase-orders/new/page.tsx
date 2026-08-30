import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createPurchaseOrder } from "../actions";

export default async function NewPurchaseOrderPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const { data: suppliers } = await supabase.from("suppliers").select("id, name").eq("organization_id", profile?.organization_id ?? "").order("name");

  return (
    <div>
      <PageHead title="New Purchase Order" crumb="Purchases / Purchase Orders / New" />
      <form action={createPurchaseOrder} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Supplier</label>
          <select name="supplier_id" required className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="" disabled selected>Select a supplier…</option>
            {(suppliers ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {(suppliers ?? []).length === 0 && (
          <p className="text-xs text-ink-muted">
            No suppliers yet — <a href="/suppliers/new" className="text-indigo font-medium">add one first</a>.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Reference</label>
            <input name="reference" placeholder="Optional PO number" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Total (₵)</label>
            <input name="total" type="number" step="0.01" min="0" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/purchase-orders" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Purchase Order</SubmitButton>
        </div>
      </form>
    </div>
  );
}
