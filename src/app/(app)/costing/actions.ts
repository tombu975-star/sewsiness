"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveOrderCost(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  if (!["owner", "manager", "super_admin"].includes(profile?.role ?? "")) throw new Error("Costing is restricted to Owner, Manager and Super Admin.");

  const order_id = String(formData.get("order_id") ?? "");
  const { error } = await supabase.from("order_costs").upsert({
    order_id,
    organization_id: profile?.organization_id,
    fabric_cost: Number(formData.get("fabric_cost") || 0),
    labor_cost: Number(formData.get("labor_cost") || 0),
    overhead_cost: Number(formData.get("overhead_cost") || 0),
    other_cost: Number(formData.get("other_cost") || 0),
    notes: formData.get("notes") || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/orders/${order_id}`);
}
