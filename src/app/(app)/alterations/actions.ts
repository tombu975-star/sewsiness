"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestAlteration(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const order_id = String(formData.get("order_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("A description is required.");

  const { error } = await supabase.from("alterations").insert({
    order_id,
    organization_id: profile?.organization_id,
    description,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/orders/${order_id}`);
  revalidatePath("/alterations");
}

export async function updateAlterationStatus(id: string, orderId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from("alterations").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/alterations");
}
