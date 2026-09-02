"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { changePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

// `className` lets a caller drop the card chrome (border/padding) when
// this is being embedded inside another container that already
// provides it — see AccountCard, which expands this in place under a
// "Change password" row instead of showing it as its own standalone
// card.
export function ChangePasswordForm({ className = "card p-6 max-w-lg space-y-4" }: { className?: string }) {
  const [state, formAction] = useFormState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      <div className="font-display font-semibold text-ink">Change Password</div>

      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Current password</label>
        <input
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">New password</label>
        <input
          name="new_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
        <p className="text-[11px] text-ink-faint mt-1">At least 8 characters.</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Confirm new password</label>
        <input
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      </div>

      {state.error && (
        <div className="text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="text-sm text-success bg-success-soft border border-success/20 rounded-lg px-3 py-2">
          {state.success}
        </div>
      )}

      <SubmitButton pendingLabel="Updating…">Update Password</SubmitButton>
    </form>
  );
}
