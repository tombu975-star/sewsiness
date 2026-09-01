"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_RECOVERY_ATTEMPTS_PER_IP = 8;
const RECOVERY_WINDOW_MINUTES = 60;

// See src/app/signup/actions.ts's clientIp() for the reasoning — Vercel
// overwrites x-forwarded-for itself, and x-vercel-forwarded-for is the
// header Vercel specifically guarantees is safe even against a proxy the
// customer puts in front of Vercel.
function clientIp(): string {
  const h = headers();
  return h.get("x-vercel-forwarded-for") || h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown";
}

// Looks up whether `contact` (the owner's email or the business's
// registered phone) matches an existing organization, and records the
// match for Super Admin/support follow-up. Always returns the same
// generic confirmation either way -- this is a public, unauthenticated
// form, so it must never reveal whether a given email/phone belongs to
// a real account.
export async function submitAccountRecovery(
  formData: FormData
): Promise<{ error: string } | { ok: true }> {
  const contact = String(formData.get("contact") || "").trim();
  if (!contact) {
    return { error: "Enter the email or phone number on your account." };
  }

  const supabase = createAdminClient();
  const ip = clientIp();

  // Checked before touching the organizations table at all — a blocked
  // IP shouldn't even get a lookup attempt, let alone write a row.
  const windowStart = new Date(Date.now() - RECOVERY_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count: recentAttempts } = await supabase
    .from("recovery_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", windowStart);
  if ((recentAttempts ?? 0) >= MAX_RECOVERY_ATTEMPTS_PER_IP) {
    // Same generic response either way — a distinct "rate limited"
    // message would itself be a signal an automated script could use
    // to fingerprint when it's been caught.
    return { ok: true };
  }
  await supabase.from("recovery_attempts").insert({ ip });

  const isEmail = /\S+@\S+\.\S+/.test(contact);

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq(isEmail ? "contact_email" : "contact_phone", isEmail ? contact.toLowerCase() : contact)
    .maybeSingle();

  await supabase.from("account_recovery_requests").insert({
    contact,
    matched_organization_id: org?.id ?? null,
  });

  return { ok: true };
}
