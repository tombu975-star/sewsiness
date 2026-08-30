"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { inviteApprentice } from "../actions";
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
      {type === "textarea" ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={3}
          required={required}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      )}
    </div>
  );
}

export function InviteApprenticeForm({ trainers }: { trainers: { id: string; full_name: string }[] }) {
  const [state, formAction] = useFormState(inviteApprentice, initialActionState);

  return (
    <form action={formAction} className="card p-6 max-w-xl space-y-4">
      {state.error && (
        <div className="rounded-sm bg-danger-soft text-danger text-sm font-medium px-3 py-2" role="alert">
          {state.error}
        </div>
      )}
      <div className="rounded-sm bg-info-soft text-info text-xs font-medium px-3 py-2">
        Login enabled — this apprentice will sign in at the same /login page as everyone else,
        scoped to only their own training tasks and portfolio.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" name="full_name" placeholder="Enter full name…" required />
        <Field label="Email" name="email" type="email" placeholder="apprentice@email.com" required />
      </div>
      <Field label="Phone" name="phone" placeholder="024 xxx xxxx" />
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Trainer</label>
        <select name="trainer_id" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
          <option value="">Unassigned</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Start date" name="start_date" type="date" />
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Training level</label>
          <select name="training_level" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="">Select…</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
      </div>
      <Field label="Specialisation" name="specialisation" placeholder="e.g. Bridal wear" />
      <Field label="Training goals" name="training_goals" type="textarea" placeholder="What should this apprentice work toward?" />
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Send invite via</label>
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 text-sm text-ink">
            <input type="radio" name="invite_via" value="email" defaultChecked /> Email
          </label>
          <label className="flex items-center gap-1.5 text-sm text-ink ml-4">
            <input type="radio" name="invite_via" value="whatsapp" /> WhatsApp link (copy manually)
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button href="/apprentices" variant="ghost">
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving…">Send Invite</SubmitButton>
      </div>
    </form>
  );
}
