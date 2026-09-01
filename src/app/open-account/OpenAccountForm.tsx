"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCover } from "@/components/auth/AuthCover";
import { submitAccountRequest } from "./actions";
import type { PlatformSettings } from "@/lib/platform-settings";

const inputCls =
  "w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-gold";
const primaryBtnCls =
  "w-full rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:brightness-105 transition-colors disabled:opacity-60";

// A lighter-weight entry point than /signup: no Ghana Card or selfie
// yet, just enough for Sewsiness to reach out and help someone get set
// up. Full self-serve verification still happens at /signup once
// they're ready.
export function OpenAccountForm({ platform }: { platform?: PlatformSettings }) {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("full_name", fullName.trim());
    fd.set("business_name", businessName.trim());
    fd.set("email", email.trim());
    fd.set("phone", phone.trim());
    const result = await submitAccountRequest(fd);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <AuthCover
      mode="open-account"
      logoUrl={platform?.logoUrl}
      coverImages={platform?.coverImages}
      headline={platform?.coverHeadline}
      subheadline={platform?.coverSubheadline}
    >
      <div className="card p-6">
        <div className="text-center mb-1">
          <div className="font-display font-bold text-lg text-ink">Open a Business Account</div>
          <div className="text-xs text-ink-muted mb-4">
            {done ? "We've got your details" : "Tell us a little about your business"}
          </div>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="text-sm text-info bg-info-soft border border-info/20 rounded-sm px-3 py-2.5">
              Thanks, {fullName.split(" ")[0] || "there"} — someone from Sewsiness will reach out to{" "}
              <span className="font-semibold">{email}</span> within one business day to help you get set up.
            </div>
            <p className="text-[11px] text-ink-faint text-center">
              In a hurry?{" "}
              <Link href="/signup" className="text-indigo font-semibold hover:underline">
                Start self-serve sign up
              </Link>{" "}
              instead.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Your full name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Comfort Owusu"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Business name</label>
              <input
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Comfort's Tailoring"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Phone number <span className="text-ink-faint font-normal">(optional)</span>
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 024 000 0000"
                className={inputCls}
              />
            </div>

            {error && (
              <div className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-sm px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className={primaryBtnCls}>
              {submitting ? "Sending…" : "Request a call back"}
            </button>
            <p className="text-[11px] text-ink-faint text-center">
              Already ready to go?{" "}
              <Link href="/signup" className="text-indigo font-semibold hover:underline">
                Sign up now
              </Link>
            </p>
          </form>
        )}

        <div className="text-center mt-5 pt-4 border-t border-border text-sm text-ink-muted">
          <Link href="/" className="font-semibold text-indigo hover:underline">
            ← Back to welcome page
          </Link>
        </div>
      </div>
    </AuthCover>
  );
}
