import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { issueRefund } from "../actions";

export default async function NewRefundPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const { data: customers } = await supabase.from("customers").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").order("full_name");

  return (
    <div>
      <PageHead title="Issue Refund" crumb="Payments / Refunds / New" />
      <form action={issueRefund} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Customer</label>
          <select name="customer_id" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="">Walk-in</option>
            {(customers ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Amount (₵)</label>
            <input name="amount" type="number" step="0.01" min="0" required className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Method</label>
            <select name="method" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
              <option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Card</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Reason</label>
          <textarea name="reason" rows={3} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/refunds" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Issue Refund</SubmitButton>
        </div>
      </form>
    </div>
  );
}
