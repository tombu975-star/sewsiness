import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PendingVerificationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let status: string | null = null;
  let reason: string | null = null;
  let businessName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organizations(name, verification_status, verification_rejection_reason)")
      .eq("id", user.id)
      .single();
    const org = (profile as any)?.organizations;
    status = org?.verification_status ?? null;
    reason = org?.verification_rejection_reason ?? null;
    businessName = org?.name ?? null;
  }

  const rejected = status === "rejected";

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="card max-w-md w-full p-8 text-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl ${
            rejected ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
          }`}
        >
          {rejected ? "⚠" : "⏳"}
        </div>
        <h1 className="font-display text-xl font-semibold text-ink mb-2">
          {rejected ? "Verification not approved" : "Verification in progress"}
        </h1>
        <p className="text-sm text-ink-muted mb-2">
          {businessName ? <span className="font-semibold text-ink">{businessName}</span> : "Your business"}
          {rejected
            ? " couldn't be verified with the Ghana Card and selfie submitted."
            : " is being reviewed against the Ghana Card and selfie submitted during signup — this usually takes under a day."}
        </p>
        {rejected && reason && (
          <p className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-sm px-3 py-2 mb-4 text-left">
            {reason}
          </p>
        )}
        <p className="text-xs text-ink-faint mb-6">
          {rejected
            ? "Contact Sewsiness support to resolve this and resubmit."
            : "No need to do anything else — come back and sign in once it's approved."}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-gold text-[#3a2400] font-semibold text-sm px-4 py-2.5 hover:brightness-105"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
