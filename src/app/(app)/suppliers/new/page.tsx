import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createSupplier } from "../actions";

export default function NewSupplierPage() {
  return (
    <div>
      <PageHead title="New Supplier" crumb="Purchases / Suppliers / New" />
      <form action={createSupplier} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Supplier name</label>
          <input name="name" required className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Phone</label>
            <input name="phone" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
            <input name="email" type="email" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Notes</label>
          <textarea name="notes" rows={3} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/suppliers" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Supplier</SubmitButton>
        </div>
      </form>
    </div>
  );
}
