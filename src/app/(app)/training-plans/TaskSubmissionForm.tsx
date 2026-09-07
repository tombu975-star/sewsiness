"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitTask } from "./actions";

export function TaskSubmissionForm({ taskId, existing }: { taskId: string; existing?: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="mt-3 space-y-2"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await submitTask(formData);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not submit this task.");
          }
        });
      }}
    >
      <input type="hidden" name="task_id" value={taskId} />
      <textarea
        name="submission_text"
        required
        defaultValue={existing ?? ""}
        rows={3}
        placeholder="Describe what you completed and what you learned…"
        className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <div>
        <label htmlFor={`evidence-${taskId}`} className="block text-xs font-semibold text-ink-muted mb-1">Evidence photo <span className="font-normal">(optional, JPG/PNG/WebP up to 12 MB)</span></label>
        <input id={`evidence-${taskId}`} name="evidence" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs text-ink-muted file:mr-3 file:rounded file:border-0 file:bg-sunken file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink" />
      </div>
      <button type="submit" disabled={pending} className="rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-[#3a2400] disabled:opacity-60">
        {pending ? "Submitting…" : "Submit for marking"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
