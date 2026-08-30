"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // Route each role to its own home — Super Admin (Sewsiness's platform
    // account) lands on /admin, never on the business dashboard.
    let destination = params.get("next");
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, suspended_at")
      .eq("id", data.user.id)
      .single();

    if (profile?.suspended_at) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account has been suspended. Contact your platform administrator.");
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
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div
          className="relative overflow-hidden rounded-[20px] px-6 py-10 text-center text-white mb-4"
          style={{ background: "linear-gradient(160deg, var(--indigo), var(--indigo2))" }}
        >
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ background: "rgba(251,191,36,.18)" }}
          />
          <svg width="44" height="44" viewBox="-270 -10 520 500" className="mx-auto mb-3 relative">
            <path
              d="M-160 250 C-80 80, 95 55, 170 150 C215 208, 180 270, 90 292 C-20 320,-85 365,-52 420 C-25 465, 80 458, 160 385"
              fill="none"
              stroke="#C9A6E8"
              strokeWidth="78"
              strokeLinecap="round"
            />
            <path
              d="M-155 250 C-78 105, 80 82, 150 155 C195 202, 165 245, 92 265"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="28"
              strokeLinecap="round"
            />
            <path d="M-25 205 L145 20" stroke="#FBBF24" strokeWidth="14" strokeLinecap="round" />
          </svg>
          <div className="font-display font-semibold text-sm tracking-wide relative" style={{ color: "#D8CFEE" }}>
            WELCOME BACK TO
          </div>
          <div className="font-display font-extrabold text-2xl relative">SEWSINESS</div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
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
          <div className="text-right text-xs font-semibold text-indigo -mt-2">Forgot password?</div>
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
            Sewsiness is invite-only. Everyone signs in here — Super Admin, Owner, Manager,
            Staff, Trainer, Apprentice and Freelancer. Contact your Madam or Owner for access.
          </p>
        </form>
      </div>
    </div>
  );
}
