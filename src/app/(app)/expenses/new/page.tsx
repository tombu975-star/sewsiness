import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createExpense } from "../actions";

export default function NewExpensePage() {
  return (
    <div>
      <PageHead title="New Expense" subtitle="This will be reflected in Reports and Business Health immediately." crumb="Expenses / New" />
      <form action={createExpense} className="card p-5 sm:p-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="expense-category" className="field-label">Category<span className="text-danger ml-1" aria-hidden="true">*</span></label>
          <input id="expense-category" name="category" required maxLength={120} placeholder="e.g. Rent, Electricity, Transport" className="field-input" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expense-amount" className="field-label">Amount (₵)<span className="text-danger ml-1" aria-hidden="true">*</span></label>
            <input id="expense-amount" name="amount" type="number" step="0.01" min="0" required className="field-input" />
          </div>
          <div>
            <label htmlFor="expense-method" className="field-label">Method</label>
            <select id="expense-method" name="method" className="field-input">
              <option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Card</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="expense-notes" className="field-label">Notes</label>
          <textarea id="expense-notes" name="notes" rows={3} maxLength={1000} className="field-input" />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
          <Button href="/expenses" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Expense</SubmitButton>
        </div>
      </form>
    </div>
  );
}
