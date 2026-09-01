import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createCustomer } from "../actions";

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">{label}</label>
      {type === "textarea" ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      )}
    </div>
  );
}

export default function NewCustomerPage() {
  return (
    <div>
      <PageHead
        title="New Customer"
        subtitle="This record will immediately be usable across Orders, Payments and Reports."
        crumb="Customers / New"
      />
      <form action={createCustomer} className="card p-6 max-w-xl space-y-4">
        <Field label="Full name" name="full_name" placeholder="Enter full name…" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone number" name="phone" placeholder="024 xxx xxxx" />
          <Field label="WhatsApp number" name="whatsapp" placeholder="024 xxx xxxx" />
        </div>
        <Field label="Email" name="email" type="email" placeholder="name@example.com" />
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Gender</label>
          <select name="gender" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="">Select…</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </div>
        <Field label="Notes" name="notes" type="textarea" placeholder="Optional notes about this customer…" />
        <div className="flex items-center gap-2 pt-2">
          <Button href="/customers" variant="ghost">
            Cancel
          </Button>
          <SubmitButton pendingLabel="Saving…">Save Customer</SubmitButton>
        </div>
      </form>
    </div>
  );
}
