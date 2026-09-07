"use client";

import { useState } from "react";
import { markAdvisoryNoteSeen } from "@/app/(app)/admin/actions";
import { SubmitButton } from "@/components/SubmitButton";

type AdvisoryNote = {
  id: string;
  message: string;
  created_at: string;
};

export function AdvisoryAlert({ notes }: { notes: AdvisoryNote[] }) {
  const [open, setOpen] = useState(notes.length > 0);

  if (!open || notes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4" role="alertdialog" aria-modal="true" aria-labelledby="advisory-alert-title">
      <div className="card w-full max-w-lg p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-burgundy mb-1">Immediate attention</div>
            <h2 id="advisory-alert-title" className="font-display text-xl font-semibold text-ink">Important business update</h2>
            <p className="text-sm text-ink-muted mt-1">Review these notes before continuing.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink text-xl leading-none" aria-label="Close important updates">
            ×
          </button>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-burgundy/20 bg-burgundy/5 p-4">
              <p className="text-sm text-ink">{note.message}</p>
              <div className="flex items-center justify-between gap-3 mt-3">
                <time className="text-xs text-ink-faint" dateTime={note.created_at}>
                  {new Date(note.created_at).toLocaleDateString()}
                </time>
                <form action={markAdvisoryNoteSeen}>
                  <input type="hidden" name="note_id" value={note.id} />
                  <SubmitButton variant="outline" pendingLabel="…" className="!py-1.5 !px-3 text-xs">
                    Dismiss
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setOpen(false)} className="mt-5 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sunken transition">
          Review later
        </button>
      </div>
    </div>
  );
}