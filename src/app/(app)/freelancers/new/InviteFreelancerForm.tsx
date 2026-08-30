"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { inviteFreelancer } from "../actions";
import { initialActionState } from "@/lib/action-state";

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
      />
    </div>
  );
}

export function InviteFreelancerForm() {
  const [state, formAction] = useFormState(inviteFreelancer, initialActionState);

  return (
    <form action={formAction} className="card p-6 max-w-xl space-y-4">
      {state.error && (
        <div className="rounded-sm bg-danger-soft text-danger text-sm font-medium px-3 py-2" role="alert">
          {state.error}
        </div>
      )}
      <div className="rounded-sm bg-info-soft text-info text-xs font-medium px-3 py-2">
        Login enabled — this freelancer will sign in at the same /login page as everyone else,
        scoped to only their own work requests and payment ledger.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" name="full_name" placeholder="Enter full name…" required />
        <Field label="Email" name="email" type="email" placeholder="freelancer@email.com" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone" name="phone" placeholder="024 xxx xxxx" />
        <Field label="WhatsApp" name="whatsapp" placeholder="024 xxx xxxx" />
      </div>
      <Field label="Location" name="location" placeholder="e.g. Wa, Upper West" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Primary skill" name="primary_skill" placeholder="e.g. Embroidery" />
        <Field label="Years experience" name="years_experience" type="number" placeholder="0" />
      </div>
      <Field label="Specialisation" name="specialisation" placeholder="e.g. Beadwork, kente styling" />
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Send invite via</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-sm text-ink">
            <input type="radio" name="invite_via" value="email" defaultChecked /> Email
          </label>
          <label className="flex items-center gap-1.5 text-sm text-ink">
            <input type="radio" name="invite_via" value="whatsapp" /> WhatsApp link (copy manually)
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button href="/freelancers" variant="ghost">
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving…">Send Invite</SubmitButton>
      </div>
    </form>
  );
}
