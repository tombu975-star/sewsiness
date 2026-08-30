"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPurchaseOrder(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const supplier_id = String(formData.get("supplier_id") ?? "");
  if (!supplier_id) throw new Error("A supplier is required.");

  const { error } = await supabase.from("purchase_orders").insert({
    organization_id: profile?.organization_id,
    supplier_id,
    reference: formData.get("reference") || null,
    total: Number(formData.get("total") || 0),
    status: "Pending",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/purchase-orders");
  redirect("/purchase-orders");
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/purchase-orders");
}
