"use client";

import { useEffect } from "react";

// Catches any error thrown inside the authenticated app (a Server
// Component render, or a Server Action called from a plain <form
// action={fn}> that isn't yet wired through useFormState — see
// staff/actions.ts and admin/actions.ts for the preferred inline-error
// pattern). Without this file, Next.js falls back to the generic
// "Application error: a server-side exception has occurred" page with
// no styling and no way back in — this keeps the sidebar/topbar (from
// the parent AppShell layout) visible and gives people a way forward.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message =
    error.message && !error.message.toLowerCase().includes("digest")
      ? error.message
      : "That action didn't go through. Nothing was saved twice, so it's safe to try again.";

  return (
    <div className="max-w-lg">
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-danger-soft text-danger flex items-center justify-center text-base font-semibold">
            !
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink mb-1">This didn&rsquo;t work</h2>
            <p className="text-sm text-ink-muted">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold px-4 py-2.5 bg-gold text-[#3a2400] border border-gold hover:brightness-105"
          >
            Try again
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold px-4 py-2.5 border border-border-strong text-ink bg-surface hover:bg-sunken"
          >
            Go back
          </button>
        </div>
        {error.digest && (
          <p className="mt-4 text-[11px] font-mono text-ink-faint">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
