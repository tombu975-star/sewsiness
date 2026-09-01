"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { AuthCover } from "@/components/auth/AuthCover";
import type { PlatformSettings } from "@/lib/platform-settings";

// Lands here from the invite email link. Supabase puts the session tokens
// in the URL fragment (#access_token=...&type=invite), which browsers never
// send to a server — so this has to run client-side. createClient() (the
// browser client) auto-detects and applies those tokens on load; we just
// wait for that to happen, then show a normal "set your password" form.
type Status = "checking" | "ready" | "expired";

export function AcceptInviteForm({ platform }: { platform?: PlatformSettings }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [fullName, setFullName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    function markReady(name?: string | null) {
      if (settled) return;
      settled = true;
      setFullName(name ?? null);
      setStatus("ready");
    }

    // Covers the case where the client already finished processing the
    // URL hash by the time this effect runs.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady(data.session.user.user_metadata?.full_name as string | undefined);
    });

    // Covers the more common case: the hash is still being processed when
    // this component mounts, and the session shows up moments later.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        markReady(session.user.user_metadata?.full_name as string | undefined);
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setStatus("expired");
      }
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();

    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setSubmitting(false);
      setError(updateErr.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

    setSubmitting(false);
    router.push(homePathForRole((profile?.role as Role) ?? "staff"));
    router.refresh();
  }

  return (
    <AuthCover
      mode="invite"
      logoUrl={platform?.logoUrl}
      coverImages={platform?.coverImages}
      headline={fullName ? `Welcome, ${fullName.split(" ")[0]}` : "You've been invited"}
      subheadline="Set a password to finish setting up your SEWSINESS account."
    >
      {status === "checking" && (
        <div className="card p-6 text-center text-sm text-ink-muted">Confirming your invite…</div>
      )}

      {status === "expired" && (
        <div className="card p-6 text-center space-y-2">
          <div className="text-sm font-semibold text-ink">This invite link has expired or was already used.</div>
          <p className="text-xs text-ink-muted">
            Ask whoever invited you (your Owner, Manager, or Trainer) to send a fresh invite.
          </p>
        </div>
      )}

      {status === "ready" && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <div className="font-display font-semibold text-ink text-sm">Set your password</div>
            <div className="text-xs text-ink-muted mt-1">
              {fullName ? `${fullName}, choose` : "Choose"} a password to finish setting up your account.
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Confirm password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              placeholder="Re-type your password"
            />
          </div>
          {error && (
            <div className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-sm px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? "Setting password…" : "Set password & continue"}
          </button>
        </form>
      )}
    </AuthCover>
  );
}
