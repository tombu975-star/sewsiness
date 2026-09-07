"use client";

import { useEffect, useState } from "react";
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
//
// A session establishing here only proves Supabase's own link token was
// still valid — which, absent a dashboard change, can be a much longer
// window than this product wants. So once a session lands, this also
// checks this app's own `invites.expires_at` (see
// supabase/migrations/032_invite_expiry_and_resend.sql) and treats the
// link as expired — signing the just-created session back out — if
// that's passed, even though Supabase itself was happy to hand it out.
// A user_id with no invites row at all (invites created before this
// feature existed) is grandfathered in as valid, since there's nothing
// to check it against.
type Status = "checking" | "ready" | "expired";

export function AcceptInviteForm({ platform }: { platform?: PlatformSettings }) {
  const [status, setStatus] = useState<Status>("checking");
  const [fullName, setFullName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    async function checkInviteAndFinish(userId: string, name?: string | null) {
      if (settled) return;
      settled = true;

      const { data: invite } = await supabase
        .from("invites")
        .select("status, expires_at")
        .eq("user_id", userId)
        .maybeSingle();

      const expired =
        invite && invite.status === "pending" && new Date(invite.expires_at).getTime() <= Date.now();

      if (expired) {
        await supabase.auth.signOut();
        setStatus("expired");
        return;
      }

      setFullName(name ?? null);
      setStatus("ready");
    }

    // Covers the case where the client already finished processing the
    // URL hash by the time this effect runs.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        checkInviteAndFinish(data.session.user.id, data.session.user.user_metadata?.full_name as string | undefined);
      }
    });

    // Covers the more common case: the hash is still being processed when
    // this component mounts, and the session shows up moments later.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        checkInviteAndFinish(session.user.id, session.user.user_metadata?.full_name as string | undefined);
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

    // Best-effort — if this fails, the person can still use the app; it
    // just means the invites row stays "pending" until it self-flags
    // expired, which doesn't affect anyone's ability to sign in later.
    await supabase.rpc("mark_own_invite_accepted");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

    setSubmitting(false);
    // Full browser navigation, not router.push — see LoginForm.tsx for why:
    // this is another place a session is newly established client-side and
    // then routed based on role, so it carries the same stale-cache risk.
    window.location.assign(homePathForRole((profile?.role as Role) ?? "staff"));
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 pr-10 text-sm text-ink outline-none focus:border-gold"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-ink-faint hover:text-ink-muted text-xs"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Confirm password</label>
            <input
              type={showPassword ? "text" : "password"}
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
