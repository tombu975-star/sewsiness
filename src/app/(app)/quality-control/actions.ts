"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitQualityCheck(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const order_id = String(formData.get("order_id") ?? "");
  const seams_ok = formData.get("seams_ok") === "on";
  const fit_ok = formData.get("fit_ok") === "on";
  const finishing_ok = formData.get("finishing_ok") === "on";

  const { error } = await supabase.from("quality_checks").insert({
    order_id,
    organization_id: profile?.organization_id,
    checked_by: user!.id,
    seams_ok,
    fit_ok,
    finishing_ok,
    passed: seams_ok && fit_ok && finishing_ok,
    notes: formData.get("notes") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/orders/${order_id}`);
  revalidatePath("/quality-control");
}
