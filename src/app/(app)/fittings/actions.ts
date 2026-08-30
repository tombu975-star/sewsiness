"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function scheduleFitting(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const order_id = String(formData.get("order_id") ?? "");
  const { error } = await supabase.from("fittings").insert({
    order_id,
    organization_id: profile?.organization_id,
    scheduled_at: formData.get("scheduled_at") || null,
    outcome: "Pending",
    notes: formData.get("notes") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/orders/${order_id}`);
  revalidatePath("/fittings");
}

export async function updateFittingOutcome(id: string, orderId: string, outcome: string) {
  const supabase = createClient();
  const { error } = await supabase.from("fittings").update({ outcome }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/fittings");
}
