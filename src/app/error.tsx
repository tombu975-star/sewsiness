"use client";

import { useEffect } from "react";

// Root error boundary. Next.js renders this instead of the generic
// "Application error: a server-side exception has occurred (Digest: ...)"
// page whenever something throws outside the authenticated (app) shell
// (e.g. on /login) and nothing more specific catches it first.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 h-12 w-12 rounded-full bg-danger-soft text-danger flex items-center justify-center text-xl">
          !
        </div>
        <h1 className="font-display text-xl font-semibold text-ink mb-2">Something went wrong</h1>
        <p className="text-sm text-ink-muted mb-6">
          {error.message && !error.message.toLowerCase().includes("digest")
            ? error.message
            : "That didn't go through. Nothing was saved twice, so it's safe to try again."}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold px-4 py-2.5 bg-gold text-[#3a2400] border border-gold hover:brightness-105"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold px-4 py-2.5 border border-border-strong text-ink bg-surface hover:bg-sunken"
          >
            Go to dashboard
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-[11px] font-mono text-ink-faint">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
