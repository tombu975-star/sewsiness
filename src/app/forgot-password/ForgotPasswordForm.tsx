"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCover } from "@/components/auth/AuthCover";

// Two steps: (1) email -> Supabase emails a 6-digit code, (2) code + new
// password -> verifyOtp signs them in with a recovery session, then
// updateUser sets the new password. No magic-link click-through — the
// person types the code themselves, per how this was asked for.
//
// IMPORTANT — one manual dashboard step this code can't do for you:
// Supabase's default "Reset Password" email template sends a
// {{ .ConfirmationURL }} link, not a bare code. For the recipient to see
// an actual 6-digit code to type here, go to Supabase dashboard →
// Authentication → Email Templates → Reset Password, and make sure the
// template includes {{ .Token }} (Supabase's own OTP starter template
// does this out of the box). Without that edit, this screen will still
// work for anyone who has the token from Supabase's API/logs, but real
// end users won't see a code to type.
export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo(`We've sent a 6-digit code to ${email}. It expires shortly, so enter it soon.`);
    setStep("confirm");
  }

  async function confirmAndChange(e: React.FormEvent) {
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
    setLoading(true);
    const supabase = createClient();

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "recovery",
    });
    if (verifyErr) {
      setLoading(false);
      setError(verifyErr.message || "That code is invalid or has expired.");
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setLoading(false);
      setError(updateErr.message);
      return;
    }

    // Force a fresh sign-in with the new password rather than carrying the
    // recovery session forward.
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/login?notice=password-changed");
    router.refresh();
  }

  return (
    <AuthCover mode="forgot">
      {step === "request" ? (
        <form onSubmit={requestCode} className="card p-6 space-y-4">
          <div className="text-center mb-1">
            <div className="font-display font-bold text-lg text-ink">Reset your password</div>
            <div className="text-xs text-ink-muted">We'll email you a 6-digit code</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              placeholder="Enter your account email"
            />
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
            {loading ? "Sending…" : "Send code"}
          </button>
          <p className="text-[11px] text-ink-faint text-center pt-1">
            <Link href="/login" className="text-indigo font-semibold hover:underline">
              ← Back to login
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={confirmAndChange} className="card p-6 space-y-4">
          <div className="text-center mb-1">
            <div className="font-display font-bold text-lg text-ink">Enter your code</div>
            <div className="text-xs text-ink-muted">Then choose a new password</div>
          </div>
          {info && (
            <div className="text-xs text-info bg-info-soft border border-info/20 rounded-sm px-3 py-2">{info}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold tracking-[0.4em] text-center font-mono text-lg"
              placeholder="······"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Confirm new password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              placeholder="Re-type the new password"
            />
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
            {loading ? "Changing password…" : "Change password"}
          </button>
          <button
            type="button"
            onClick={() => setStep("request")}
            className="w-full text-[11px] text-ink-faint text-center hover:text-ink-muted"
          >
            Didn't get a code? Send again
          </button>
        </form>
      )}
    </AuthCover>
  );
}
