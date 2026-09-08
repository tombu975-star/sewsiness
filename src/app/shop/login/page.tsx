"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setSubmitting(false);
      setError("Incorrect email or password. Please try again.");
      return;
    }

    // A staff/business login (created via /signup, not /shop/signup) can
    // still successfully authenticate here — Supabase doesn't know the
    // difference. Only a row in shop_customers means "this is actually
    // a shopper account", so that's what gates entry to /shop/home.
    const { data: customer } = await supabase
      .from("shop_customers")
      .select("id")
      .eq("id", data.user.id)
      .single();

    if (!customer) {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("This isn't a customer account. If you work at a tailoring business, sign in at the staff login instead.");
      return;
    }

    window.location.assign("/shop/home");
  }

  return (
    <main className="min-h-screen bg-canvas px-5 py-8 sm:px-8">
      <div className="kente-strip fixed left-0 top-0" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="card w-full bg-surface p-6 sm:p-8">
          <Link href="/shop/welcome" className="text-xs font-semibold text-indigo hover:underline">
            Back to customer welcome
          </Link>
          <div className="mt-8">
            <div className="eyebrow">Customer account</div>
            <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-ink-muted">Sign in to track your orders and favourite tailors.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="login-email" className="field-label">Email address</label>
              <input id="login-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input" autoComplete="email" />
            </div>
            <div>
              <label htmlFor="login-password" className="field-label">Password</label>
              <input id="login-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" autoComplete="current-password" />
            </div>

            {error && <div className="rounded-sm border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs text-danger">{error}</div>}

            <button type="submit" disabled={submitting} className="w-full rounded-full bg-indigo px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            New here? <Link href="/shop/signup" className="font-semibold text-indigo hover:underline">Create a customer account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
