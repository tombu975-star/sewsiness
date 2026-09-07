"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveLoginDestination } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { AuthCover } from "@/components/auth/AuthCover";
import type { PlatformSettings } from "@/lib/platform-settings";

// Remembers only the *identifier* (email or phone), never the password —
// deliberately not our job to store a raw password anywhere. The
// password-manager prompt that "remember password" usually implies
// comes from the browser itself: autoComplete="username" below on the
// identifier field plus autoComplete="current-password" on the password
// field is what triggers Chrome/Safari/Firefox's own "Save password?"
// dialog, which stores it encrypted in the browser/OS keychain rather
// than anywhere this app controls.
const REMEMBER_KEY = "sewsiness_remember_identifier";

// Every step of sign-in is a network round trip to Supabase (rate-limit
// check, password verify, profile lookup). None of Supabase's own client
// calls have a built-in timeout, so if one of those requests is silently
// dropped — a browser extension blocking third-party requests, a flaky
// network, Supabase itself being briefly unreachable — `await` just hangs
// and the "Signing in…" button spins forever with no error and no way
// out except reloading the page. Racing each call against a timeout
// guarantees the UI always lands on a real outcome.
const REQUEST_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out. Check your connection and try again.`));
    }, REQUEST_TIMEOUT_MS);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export function LoginForm({ platform }: { platform?: PlatformSettings }) {
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const notice = params.get("notice");

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const trimmedIdentifier = identifier.trim();

    // Login accepts either an email or the phone number on file for the
    // account (see supabase/migrations/033_login_by_phone_or_email.sql)
    // — resolve whichever was typed to a real email before signing in,
    // since Supabase's password auth here only understands email.
    let loginEmail = trimmedIdentifier.toLowerCase();
    if (!trimmedIdentifier.includes("@")) {
      const { data: resolvedEmail } = await withTimeout(
        supabase.rpc("resolve_login_email", { p_identifier: trimmedIdentifier }),
        "Looking up your account"
      );
      // Falls back to the raw input if nothing matched — signInWithPassword
      // then fails with Supabase's own generic "Invalid login credentials",
      // same as a typo'd email would, so this never reveals whether a
      // phone number is registered.
      loginEmail = (resolvedEmail as string | null) ?? trimmedIdentifier;
    }

    const { data: retryAfterSeconds } = await withTimeout(
      supabase.rpc("is_login_rate_limited", { p_email: loginEmail }),
      "Checking sign-in status"
    );
    if (retryAfterSeconds && retryAfterSeconds > 0) {
      setLoading(false);
      const minutes = Math.ceil(retryAfterSeconds / 60);
      setError(`Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
      return;
    }

    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email: loginEmail, password }),
      "Signing in"
    );
    if (error) {
      // Best-effort: a slow/failed write here should never block showing
      // the real sign-in error to the person waiting on the button.
      withTimeout(supabase.rpc("record_login_attempt", { p_email: loginEmail, p_success: false }), "Recording attempt").catch(
        () => {}
      );
      setLoading(false);
      setError(error.message);
      return;
    }
    withTimeout(supabase.rpc("record_login_attempt", { p_email: loginEmail, p_success: true }), "Recording attempt").catch(
      () => {}
    );

    if (remember) {
      window.localStorage.setItem(REMEMBER_KEY, trimmedIdentifier);
    } else {
      window.localStorage.removeItem(REMEMBER_KEY);
    }

    const nextParam = params.get("next");
    const { data: profile } = await withTimeout(
      supabase
        .from("profiles")
        .select("role, suspended_at, organization_id, organizations(verification_status, verification_rejection_reason)")
        .eq("id", data.user.id)
        .single(),
      "Loading your profile"
    );

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
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    }
  }

  return (
    <AuthCover
      mode="login"
      logoUrl={platform?.logoUrl}
      coverImages={platform?.coverImages}
      headline={platform?.coverHeadline}
      subheadline={platform?.coverSubheadline}
    >
      <form
        onSubmit={handleSubmit}
        className="card p-6 space-y-3.5"
        style={{ boxShadow: "var(--shadow-lg)", borderRadius: "20px" }}
      >
        <div className="text-center mb-1.5">
          <div className="font-display font-bold text-xl text-ink">Welcome back</div>
          <div className="text-xs text-ink-muted mt-0.5">Sign in to your workspace</div>
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
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email or phone number</label>
          <input
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
            placeholder="Enter your email or phone number"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 pr-10 text-sm text-ink outline-none focus:border-gold"
              placeholder="Enter your password"
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
        <div className="flex items-center justify-between -mt-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-3.5 h-3.5 rounded-sm border-border accent-gold"
            />
            Remember me
          </label>
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
          className="w-full rounded-sm bg-indigo text-white font-semibold text-sm py-2.5 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
        <p className="text-[11px] text-ink-faint text-center leading-relaxed pt-0.5">
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