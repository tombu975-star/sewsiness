"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { enrollBusiness } from "../actions";
import { initialActionState } from "@/lib/action-state";

export function EnrollBusinessForm() {
  const [state, formAction] = useFormState(enrollBusiness, initialActionState);

  return (
    <form action={formAction} className="card p-6 max-w-xl space-y-4">
      {state.error && (
        <div className="rounded-sm bg-danger-soft text-danger text-sm font-medium px-3 py-2" role="alert">
          {state.error}
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Business name</label>
        <input
          name="business_name"
          required
          placeholder="e.g. Comfort's Tailoring"
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Region / City</label>
          <input
            name="region"
            placeholder="e.g. Kumasi"
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Plan</label>
          <select
            name="plan"
            defaultValue="Standard"
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          >
            <option value="Standard">Standard</option>
            <option value="Pro">Pro</option>
            <option value="Trial">Trial</option>
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3 mt-3">
          Owner account
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Owner&rsquo;s full name</label>
            <input
              name="owner_name"
              required
              placeholder="e.g. Comfort Asante"
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Owner&rsquo;s email</label>
            <input
              name="owner_email"
              type="email"
              required
              placeholder="comfort@example.com"
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      <div className="callout">
        This creates the business&rsquo;s workspace (with a default &ldquo;Main&rdquo; branch) and sends the owner
        an email invite to set their password. You&rsquo;re not added as a member of their business — Super Admin
        only ever sees the operational signals on this page, never their day-to-day data.
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button href="/admin" variant="ghost">
          Cancel
        </Button>
        <SubmitButton pendingLabel="Enrolling…">Enroll Business</SubmitButton>
      </div>
    </form>
  );
}
