"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewTask } from "./actions";

export function TaskReviewForm({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit(decision: "Approved" | "Needs Changes") {
    setError(null);
    const form = document.getElementById(`review-${taskId}`) as HTMLFormElement;
    const data = new FormData(form);
    data.set("decision", decision);
    startTransition(async () => {
      try {
        await reviewTask(data);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save the assessment.");
      }
    });
  }

  return (
    <form id={`review-${taskId}`} className="mt-3 space-y-2">
      <input type="hidden" name="task_id" value={taskId} />
      <div className="flex flex-wrap gap-2">
        <input name="score" type="number" min="0" max="100" defaultValue="100" className="w-20 rounded-sm border border-border bg-surface px-2 py-1.5 text-xs" aria-label="Score" />
        <input name="feedback" placeholder="Feedback for apprentice" className="min-w-[220px] flex-1 rounded-sm border border-border bg-surface px-2 py-1.5 text-xs" />
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={() => submit("Approved")} className="rounded-lg bg-success px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Approve"}
        </button>
        <button type="button" disabled={pending} onClick={() => submit("Needs Changes")} className="rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-ink disabled:opacity-60">
          Needs changes
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
