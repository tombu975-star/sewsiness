"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveLoginDestination } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { AuthCover } from "@/components/auth/AuthCover";
import type { PlatformSettings } from "@/lib/platform-settings";

export function LoginForm({ platform }: { platform?: PlatformSettings }) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const notice = params.get("notice");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data: retryAfterSeconds } = await supabase.rpc("is_login_rate_limited", { p_email: normalizedEmail });
    if (retryAfterSeconds && retryAfterSeconds > 0) {
      setLoading(false);
      const minutes = Math.ceil(retryAfterSeconds / 60);
      setError(`Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      await supabase.rpc("record_login_attempt", { p_email: normalizedEmail, p_success: false });
      setLoading(false);
      setError(error.message);
      return;
    }
    await supabase.rpc("record_login_attempt", { p_email: normalizedEmail, p_success: true });

    const nextParam = params.get("next");
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, suspended_at, organization_id, organizations(verification_status, verification_rejection_reason)")
      .eq("id", data.user.id)
      .single();

    if (profile?.suspended_at) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account has been suspended. Contact your platform administrator.");
      return;
    }

    // A self-signed-up business isn't usable until Super Admin has reviewed
    // its Ghana Card + selfie — see /pending-verification.
    const org = (profile as any)?.organizations;
    if (org && org.verification_status !== "verified") {
      setLoading(false);
      window.location.assign("/pending-verification");
      return;
    }

    const destination = resolveLoginDestination((profile?.role as Role) ?? "staff", nextParam);

    // Full browser navigation, not router.push — mirrors handleSignOut in
    // AppShell.tsx. A client-side push can render off the Router Cache,
    // which is keyed by URL only, not by session/role: if this tab ever
    // rendered a page as a different signed-in account (e.g. someone
    // switching accounts without closing the tab), a stale, wrong-role
    // page — including another role's dashboard — could flash before the
    // fresh server response replaces it. A hard navigation guarantees the
    // cache is discarded and the very first paint is already correctly
    // scoped to the just-authenticated user's real role.
    window.location.assign(destination);
  }

  return (
    <AuthCover
      mode="login"
      logoUrl={platform?.logoUrl}
      coverImages={platform?.coverImages}
      headline={platform?.coverHeadline}
      subheadline={platform?.coverSubheadline}
    >
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="text-center mb-1">
          <div className="font-display font-bold text-lg text-ink">Welcome back</div>
          <div className="text-xs text-ink-muted">Sign in to your workspace</div>
        </div>
        {notice === "password-changed" && (
          <div className="text-xs text-success bg-success-soft border border-success/20 rounded-sm px-3 py-2">
            Password changed — sign in with your new password.
          </div>
        )}
        {notice === "signup-submitted" && (
          <div className="text-xs text-success bg-success-soft border border-success/20 rounded-sm px-3 py-2">
            Application received. You can sign in now to check your verification status.
          </div>
        )}
        {notice === "inactivity" && (
          <div className="text-xs text-ink-muted bg-sunken border border-border rounded-sm px-3 py-2">
            You were signed out because of inactivity.
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
            placeholder="Enter your password"
          />
        </div>
        <div className="flex justify-between -mt-2">
          <Link href="/forgot-account" className="text-xs font-semibold text-ink-muted hover:text-ink">
            Forgot account number?
          </Link>
          <Link href="/forgot-password" className="text-xs font-semibold text-indigo hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && (
          <div className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-sm px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:brightness-105 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
        <p className="text-[11px] text-ink-faint text-center pt-1">
          Everyone signs in here — Super Admin, Owner, Manager, Staff, Trainer, Apprentice and
          Freelancer. Staff-level accounts are invited by their business; new businesses{" "}
          <Link href="/signup" className="text-indigo font-semibold hover:underline">
            create an account here
          </Link>
          .
        </p>
      </form>
    </AuthCover>
  );
}
