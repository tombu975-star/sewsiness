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

  // The moment any stage actually starts, the order itself is no longer
  // just "Pending" — without this, staff working entirely from this tab
  // never touch the order's own status dropdown, so it sits on "Pending"
  // indefinitely even as the garment moves through Sewing/Finishing. That
  // silently breaks the dashboard's "In Production" and "Due Today"
  // counts, which key off custom_orders.status, not production_stages.
  // Only ever moves Pending -> In Progress here — marking a stage Done
  // never auto-completes the order, since "Completed" in this app's
  // status set implies delivery/handoff, which stage data alone can't
  // confirm.
  const { data: order } = await supabase.from("custom_orders").select("status").eq("id", order_id).maybeSingle();
  if (order?.status === "Pending") {
    await supabase.from("custom_orders").update({ status: "In Progress" }).eq("id", order_id);
  }

  revalidatePath(`/orders/${order_id}`);
  revalidatePath("/production");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}
