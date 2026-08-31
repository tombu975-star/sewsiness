"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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
