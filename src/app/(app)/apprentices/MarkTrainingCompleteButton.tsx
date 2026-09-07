"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markTrainingComplete } from "./actions";

export function MarkTrainingCompleteButton({ apprenticeId }: { apprenticeId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await markTrainingComplete(apprenticeId);
      if ("error" in res) {
        setError(res.error);
      } else {
        // Certificate number/completed_at now live in the DB — a full
        // refresh (rather than local state) re-renders this page's
        // server-fetched data so the certificate download link appears
        // immediately, not just after a manual reload.
        router.refresh();
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 bg-gold text-[#3a2400] hover:brightness-[1.03] border border-gold transition-all duration-150 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
        style={{ boxShadow: "var(--shadow-gold)" }}
      >
        {pending ? "Marking Complete…" : "Mark Training Complete — Issue Certificate"}
      </button>
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
}
