import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createOrder } from "../actions";

export default async function NewOrderPage({ searchParams }: { searchParams: { customer?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("full_name");

  return (
    <div>
      <PageHead title="New Order" subtitle="This order will immediately be usable across Costing, Payments and Reports." crumb="Dressmaking / Custom Orders / New" />
      <form action={createOrder} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Customer</label>
          <select
            name="customer_id"
            required
            defaultValue={searchParams.customer ?? ""}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          >
            <option value="" disabled>
              Select a customer…
            </option>
            {(customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Garment</label>
          <input
            name="garment"
            required
            placeholder="e.g. Kaba & Slit"
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Due date</label>
            <input
              name="due_date"
              type="date"
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Priority</label>
            <select name="priority" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
              <option>Normal</option>
              <option>Low</option>
              <option>High</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Total amount (₵)</label>
          <input
            name="total_amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/orders" variant="ghost">
            Cancel
          </Button>
          <SubmitButton pendingLabel="Saving…">Save Order</SubmitButton>
        </div>
      </form>
    </div>
  );
}
