import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createCustomer } from "../actions";

function Field({ label, name, type = "text", placeholder, required = false, autoComplete }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean; autoComplete?: string }) {
  return (
    <div>
      <label htmlFor={name} className="field-label">{label}{required && <span className="text-danger ml-1" aria-hidden="true">*</span>}</label>
      {type === "textarea" ? (
        <textarea
          name={name}
          id={name}
          required={required}
          maxLength={1000}
          placeholder={placeholder}
          rows={3}
          className="field-input"
        />
      ) : (
        <input
          name={name}
          id={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          maxLength={type === "email" ? 254 : 120}
          placeholder={placeholder}
          className="field-input"
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
      <form action={createCustomer} className="card p-5 sm:p-6 max-w-xl space-y-4">
        <Field label="Full name" name="full_name" required autoComplete="name" placeholder="Enter full name…" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone number" name="phone" type="tel" autoComplete="tel" placeholder="024 xxx xxxx" />
          <Field label="WhatsApp number" name="whatsapp" type="tel" placeholder="024 xxx xxxx" />
        </div>
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="name@example.com" />
        <div>
          <label htmlFor="gender" className="field-label">Gender</label>
          <select id="gender" name="gender" className="field-input">
            <option value="">Select…</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </div>
        <Field label="Notes" name="notes" type="textarea" placeholder="Optional notes about this customer…" />
        <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
          <Button href="/customers" variant="ghost">
            Cancel
          </Button>
          <SubmitButton pendingLabel="Saving…">Save Customer</SubmitButton>
        </div>
      </form>
    </div>
  );
}
