"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "./actions";

export function TaskStatusSelect({ taskId, current }: { taskId: string; current: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <select
      defaultValue={current}
      disabled={isPending}
      onChange={(e) => startTransition(async () => { await updateTaskStatus(taskId, e.target.value); router.refresh(); })}
      className="rounded-sm border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink outline-none focus:border-gold disabled:opacity-60"
    >
      <option>Assigned</option><option>In Progress</option><option>Done</option>
    </select>
  );
}
