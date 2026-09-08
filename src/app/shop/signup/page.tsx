"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CustomerSignupPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), account_type: "shop_customer" } },
    });

    if (signUpError) {
      setSubmitting(false);
      setError(signUpError.message);
      return;
    }

    if (!data.user) {
      setSubmitting(false);
      setError("Something went wrong creating your account. Please try again.");
      return;
    }

    // The auth user exists at this point, but nothing about them being a
    // shopper (vs. a staff member, vs. nothing at all) exists anywhere
    // else yet — this row is what /shop/login and every other shop page
    // actually looks up to know who's signed in.
    const { error: profileError } = await supabase.from("shop_customers").insert({
      id: data.user.id,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      email: email.trim(),
    });

    setSubmitting(false);

    if (profileError) {
      setError("Your account was created, but we couldn't finish setting it up. Please try signing in — if that doesn't work, contact support.");
      return;
    }

    if (data.session) {
      window.location.assign("/shop/home");
      return;
    }

    setMessage("Your account has been created. Check your email to confirm it, then sign in.");
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
            <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Create your customer account</h1>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Save your preferences, follow orders, and connect with tailors you love.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="full-name" className="field-label">Full name</label>
              <input id="full-name" required value={fullName} onChange={(event) => setFullName(event.target.value)} className="field-input" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="customer-phone" className="field-label">Phone number</label>
              <input id="customer-phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="field-input" autoComplete="tel" placeholder="Optional" />
            </div>
            <div>
              <label htmlFor="customer-email" className="field-label">Email address</label>
              <input id="customer-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input" autoComplete="email" />
            </div>
            <div>
              <label htmlFor="customer-password" className="field-label">Password</label>
              <input id="customer-password" required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" autoComplete="new-password" />
            </div>

            {error && <div className="rounded-sm border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs text-danger">{error}</div>}
            {message && <div className="rounded-sm border border-success/20 bg-success-soft px-3 py-2.5 text-xs text-success">{message}</div>}

            <button type="submit" disabled={submitting} className="w-full rounded-full bg-indigo px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Creating account..." : "Create customer account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Already have a customer account? <Link href="/shop/login" className="font-semibold text-indigo hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
