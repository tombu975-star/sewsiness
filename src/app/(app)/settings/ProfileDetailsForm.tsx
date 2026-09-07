"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { updateProfile, type ProfileUpdateState } from "./actions";

const initialState: ProfileUpdateState = {};

export function ProfileDetailsForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [state, formAction] = useFormState(updateProfile, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="card p-6 max-w-lg space-y-4">
      <div className="font-display font-semibold text-ink">Personal details</div>
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Full name</label>
        <input name="full_name" defaultValue={fullName} required maxLength={120} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Phone</label>
        <input name="phone" type="tel" defaultValue={phone} maxLength={40} placeholder="e.g. 024 000 0000" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
        <input value={email} disabled className="w-full rounded-lg border border-border bg-sunken px-3 py-2 text-sm text-ink-muted" />
        <p className="text-[11px] text-ink-faint mt-1">Contact support to change the email on your account.</p>
      </div>
      {state.error && <div className="text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2" role="alert">{state.error}</div>}
      {state.success && <div className="text-sm text-success bg-success-soft border border-success/20 rounded-lg px-3 py-2" role="status">{state.success}</div>}
      <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
    </form>
  );
}
