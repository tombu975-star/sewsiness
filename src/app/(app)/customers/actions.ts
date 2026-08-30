"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCustomer(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, branch_id")
    .eq("id", user.id)
    .single();

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) throw new Error("Full name is required");

  const { data, error } = await supabase
    .from("customers")
    .insert({
      organization_id: profile?.organization_id,
      branch_id: profile?.branch_id ?? null,
      full_name,
      phone: formData.get("phone") || null,
      whatsapp: formData.get("whatsapp") || null,
      email: formData.get("email") || null,
      gender: formData.get("gender") || null,
      notes: formData.get("notes") || null,
      status: "New",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}
