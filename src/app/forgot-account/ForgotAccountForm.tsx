"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCover } from "@/components/auth/AuthCover";
import { submitAccountRecovery } from "./actions";
import type { PlatformSettings } from "@/lib/platform-settings";

const inputCls =
  "w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-gold";
const primaryBtnCls =
  "w-full rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:brightness-105 transition-colors disabled:opacity-60";

// Recovers which business account someone belongs to -- distinct from
// /forgot-password, which resets a known account's credentials. Always
// shows the same confirmation regardless of whether a match was found.
export function ForgotAccountForm({ platform }: { platform?: PlatformSettings }) {
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("contact", contact.trim());
    const result = await submitAccountRecovery(fd);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <AuthCover
      mode="forgot-account"
      logoUrl={platform?.logoUrl}
      coverImages={platform?.coverImages}
      headline={platform?.coverHeadline}
      subheadline={platform?.coverSubheadline}
    >
      <div className="card p-6">
        <div className="text-center mb-1">
          <div className="font-display font-bold text-lg text-ink">Recover Your Account</div>
          <div className="text-xs text-ink-muted mb-4">
            {done ? "Check your registered contact" : "Forgotten which business account you use?"}
          </div>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="text-sm text-info bg-info-soft border border-info/20 rounded-sm px-3 py-2.5">
              If that matches an account on file, we&rsquo;ll follow up at the registered contact with
              your account details.
            </div>
            <p className="text-[11px] text-ink-faint text-center">
              Know your login already?{" "}
              <Link href="/login" className="text-indigo font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Email or business phone number
              </label>
              <input
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Enter your email or phone"
                className={inputCls}
              />
            </div>

            {error && (
              <div className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-sm px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className={primaryBtnCls}>
              {submitting ? "Sending…" : "Continue"}
            </button>
            <p className="text-[11px] text-ink-faint text-center">
              Remember your password instead?{" "}
              <Link href="/forgot-password" className="text-indigo font-semibold hover:underline">
                Reset it here
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
