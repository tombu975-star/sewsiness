"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { AuthCover } from "@/components/auth/AuthCover";

export function LoginForm() {
  const router = useRouter();
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    let destination = params.get("next");
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
      router.push("/pending-verification");
      router.refresh();
      return;
    }

    if (!destination) {
      destination = homePathForRole((profile?.role as Role) ?? "staff");
    }

    setLoading(false);
    router.push(destination);
    router.refresh();
  }

  return (
    <AuthCover mode="login">
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
        <div className="text-right -mt-2">
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
