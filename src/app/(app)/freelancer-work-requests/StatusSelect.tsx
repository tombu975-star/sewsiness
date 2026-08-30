"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWorkRequestStatus } from "./actions";

export function StatusSelect({ id, current, options }: { id: string; current: string; options: string[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <select
      defaultValue={current}
      disabled={isPending}
      onChange={(e) => startTransition(async () => { await updateWorkRequestStatus(id, e.target.value); router.refresh(); })}
      className="rounded-sm border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink outline-none focus:border-gold disabled:opacity-60"
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}
