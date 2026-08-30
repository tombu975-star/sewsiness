import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createExpense } from "../actions";

export default function NewExpensePage() {
  return (
    <div>
      <PageHead title="New Expense" subtitle="This will be reflected in Reports and Business Health immediately." crumb="Expenses / New" />
      <form action={createExpense} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Category</label>
          <input name="category" required placeholder="e.g. Rent, Electricity, Transport" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
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
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Notes</label>
          <textarea name="notes" rows={3} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/expenses" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Expense</SubmitButton>
        </div>
      </form>
    </div>
  );
}
