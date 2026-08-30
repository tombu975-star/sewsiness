"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { inviteStaff } from "../actions";
import { initialActionState } from "@/lib/action-state";

export function InviteStaffForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(inviteStaff, initialActionState);

  return (
    <form action={formAction} className="card p-6 max-w-xl space-y-4">
      {state.error && (
        <div className="rounded-sm bg-danger-soft text-danger text-sm font-medium px-3 py-2" role="alert">
          {state.error}
        </div>
      )}
      <div className="rounded-sm bg-info-soft text-info text-xs font-medium px-3 py-2">
        New staff receive an invite link by email and set their own password.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Full name</label>
          <input name="full_name" required className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
          <input name="email" type="email" required className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Role</label>
          <select name="role" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="trainer">Trainer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Branch</label>
          <select name="branch_id" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="">Unassigned</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button href="/staff" variant="ghost">Cancel</Button>
        <SubmitButton pendingLabel="Saving…">Send Invite</SubmitButton>
      </div>
    </form>
  );
}
