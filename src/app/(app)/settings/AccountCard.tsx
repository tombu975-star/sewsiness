"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logSignOut } from "@/app/(app)/audit/actions";
import { Spinner } from "@/components/Spinner";
import { ChangePasswordForm } from "./ChangePasswordForm";

// Chevron-list settings pattern: an "ACCOUNT" card holding a stack of
// icon + title + description rows, each either expanding in place
// (Change password) or firing an action (Sign out) — the same shape as
// a mobile app's Profile screen, adapted for a single-page settings
// screen that has nowhere else to navigate a row "into."
export function AccountCard() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    // Same audit-then-signout sequence as the header account menu (see
    // AppShell's handleSignOut) — kept in sync so a "manual" sign-out
    // is logged consistently no matter which control triggered it.
    await logSignOut("manual");
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full browser navigation, not router.push — discards the Router
    // Cache so no stale authenticated page can flash back in.
    window.location.assign("/login");
  }

  return (
    <div className="card overflow-hidden max-w-lg">
      <div className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Account</div>
      <div className="divide-y divide-border">
        <button
          type="button"
          onClick={() => setPasswordOpen((v) => !v)}
          aria-expanded={passwordOpen}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-sunken transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-indigo-soft flex items-center justify-center text-indigo text-sm flex-shrink-0">
            🔒
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-ink">Change password</span>
            <span className="block text-xs text-ink-muted">Update the password for your account</span>
          </span>
          <span
            className={`text-ink-faint text-lg flex-shrink-0 transition-transform ${passwordOpen ? "rotate-90" : ""}`}
            aria-hidden
          >
            ›
          </span>
        </button>
        {passwordOpen && (
          <div className="px-5 pb-5 pt-1 bg-sunken/40">
            <ChangePasswordForm className="space-y-4" />
          </div>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-danger-soft transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          <span className="w-9 h-9 rounded-full bg-danger-soft flex items-center justify-center text-danger text-sm flex-shrink-0">
            {signingOut ? <Spinner /> : "⎋"}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-danger">{signingOut ? "Signing out…" : "Sign out"}</span>
            <span className="block text-xs text-ink-muted">Sign out of this device</span>
          </span>
        </button>
      </div>
    </div>
  );
}
