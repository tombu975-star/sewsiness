"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function generateOrderNumber() {
  const n = Math.floor(10000 + Math.random() * 89999);
  return `SW-${n}`;
}

export async function createOrder(formData: FormData) {
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

  const customer_id = String(formData.get("customer_id") ?? "");
  const garment = String(formData.get("garment") ?? "").trim();
  if (!customer_id || !garment) throw new Error("Customer and garment are required");

  const { data, error } = await supabase
    .from("custom_orders")
    .insert({
      organization_id: profile?.organization_id,
      branch_id: profile?.branch_id ?? null,
      order_number: generateOrderNumber(),
      customer_id,
      garment,
      due_date: formData.get("due_date") || null,
      total_amount: Number(formData.get("total_amount") || 0),
      amount_paid: 0,
      status: "Pending",
      priority: (formData.get("priority") as string) || "Normal",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/orders");
  redirect(`/orders/${data.id}`);
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from("custom_orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

export async function recordOrderPayment(formData: FormData) {
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

  const order_id = String(formData.get("order_id") ?? "");
  const customer_id = String(formData.get("customer_id") ?? "");
  const amount = Number(formData.get("amount") || 0);
  if (!order_id || amount <= 0) throw new Error("A valid amount is required");

  const { error: payErr } = await supabase.from("payments").insert({
    organization_id: profile?.organization_id,
    branch_id: profile?.branch_id ?? null,
    order_id,
    customer_id,
    amount,
    method: (formData.get("method") as string) || "Cash",
    type: (formData.get("type") as string) || "Deposit",
    notes: formData.get("notes") || null,
  });
  if (payErr) throw new Error(payErr.message);

  const { data: order } = await supabase.from("custom_orders").select("amount_paid").eq("id", order_id).single();
  const { error: updErr } = await supabase
    .from("custom_orders")
    .update({ amount_paid: Number(order?.amount_paid ?? 0) + amount })
    .eq("id", order_id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/orders/${order_id}`);
  revalidatePath("/payments");
}
