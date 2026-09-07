import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createSupplier } from "../actions";

export default function NewSupplierPage() {
  return (
    <div>
      <PageHead title="New Supplier" crumb="Purchases / Suppliers / New" />
      <form action={createSupplier} className="card p-5 sm:p-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="supplier-name" className="field-label">Supplier name<span className="text-danger ml-1" aria-hidden="true">*</span></label>
          <input id="supplier-name" name="name" required maxLength={120} autoComplete="organization" className="field-input" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="supplier-phone" className="field-label">Phone</label>
            <input id="supplier-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className="field-input" />
          </div>
          <div>
            <label htmlFor="supplier-email" className="field-label">Email</label>
            <input id="supplier-email" name="email" type="email" maxLength={254} autoComplete="email" className="field-input" />
          </div>
        </div>
        <div>
          <label htmlFor="supplier-notes" className="field-label">Notes</label>
          <textarea id="supplier-notes" name="notes" rows={3} maxLength={1000} className="field-input" />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
          <Button href="/suppliers" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Supplier</SubmitButton>
        </div>
      </form>
    </div>
  );
}
