"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logCustomerMaterial(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const customer_id = String(formData.get("customer_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!customer_id || !description) throw new Error("Customer and description are required.");

  const { error } = await supabase.from("customer_materials").insert({
    customer_id,
    organization_id: profile?.organization_id,
    description,
    quantity: formData.get("quantity") || null,
    received_at: formData.get("received_at") || new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/customer-materials");
  revalidatePath(`/customers/${customer_id}`);
  redirect(`/customers/${customer_id}`);
}

export async function markMaterialReturned(id: string, customerId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("customer_materials").update({ returned: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/customer-materials");
  revalidatePath(`/customers/${customerId}`);
}
