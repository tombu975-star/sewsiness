import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { logCustomerMaterial } from "../actions";

export default async function NewCustomerMaterialPage({ searchParams }: { searchParams: { customer?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const { data: customers } = await supabase.from("customers").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").order("full_name");

  return (
    <div>
      <PageHead title="Log Customer Material" crumb="Customers / Customer Materials / New" />
      <form action={logCustomerMaterial} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Customer</label>
          <select name="customer_id" required defaultValue={searchParams.customer ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="" disabled>Select a customer…</option>
            {(customers ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Description</label>
          <input name="description" required placeholder="e.g. 6 yards of blue kente" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Quantity</label>
            <input name="quantity" placeholder="e.g. 6 yards" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Received date</label>
            <input name="received_at" type="date" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/customer-materials" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Log Material</SubmitButton>
        </div>
      </form>
    </div>
  );
}
