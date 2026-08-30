"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSupplier(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Supplier name is required.");

  const { error } = await supabase.from("suppliers").insert({
    organization_id: profile?.organization_id,
    name,
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    notes: formData.get("notes") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/suppliers");
  redirect("/suppliers");
}
