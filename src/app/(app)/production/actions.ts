"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function advanceStage(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const order_id = String(formData.get("order_id") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const status = String(formData.get("status") ?? "In Progress");

  const { data: existing } = await supabase.from("production_stages").select("id").eq("order_id", order_id).eq("stage", stage).maybeSingle();

  if (existing) {
    await supabase.from("production_stages").update({ status, updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await supabase.from("production_stages").insert({ order_id, organization_id: profile?.organization_id, stage, status });
  }
  revalidatePath(`/orders/${order_id}`);
  revalidatePath("/production");
}
