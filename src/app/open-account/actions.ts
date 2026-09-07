"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function submitAccountRequest(
  formData: FormData
): Promise<{ error: string } | { ok: true }> {
  const fullName = String(formData.get("full_name") || "").trim();
  const businessName = String(formData.get("business_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();

  if (!fullName || !businessName || !email) {
    return { error: "Please fill in your name, business name, and email." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("account_requests").insert({
    full_name: fullName,
    business_name: businessName,
    email,
    phone: phone || null,
  });

  if (error) {
    return { error: "Something went wrong on our end. Please try again in a moment." };
  }

  return { ok: true };
}
