"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { assignApprenticeTrainer } from "../actions";
import { initialActionState } from "@/lib/action-state";

export function AssignTrainerForm({
  apprenticeId,
  currentTrainerId,
  trainers,
}: {
  apprenticeId: string;
  currentTrainerId: string | null;
  trainers: { id: string; full_name: string }[];
}) {
  const [state, formAction] = useFormState(assignApprenticeTrainer, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="apprentice_id" value={apprenticeId} />
      <div className="flex items-center gap-2">
        <select
          name="trainer_id"
          defaultValue={currentTrainerId ?? ""}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        >
          <option value="">Unassigned</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
        <SubmitButton pendingLabel="Saving…" className="!px-4 !py-2 text-xs whitespace-nowrap">
          Save
        </SubmitButton>
      </div>
      {state.error && (
        <div className="rounded-sm bg-danger-soft text-danger text-xs font-medium px-3 py-2" role="alert">
          {state.error}
        </div>
      )}
    </form>
  );
}
