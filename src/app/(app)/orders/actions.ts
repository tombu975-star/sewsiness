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
      status: "New",
      priority: (formData.get("priority") as string) || "Normal",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const initialPayment = Number(formData.get("initial_payment") || 0);
  const totalAmount = Number(formData.get("total_amount") || 0);
  if (initialPayment > 0) {
    if (initialPayment > totalAmount) throw new Error("Initial payment cannot be more than the order total");
    const { error: paymentError } = await supabase.from("payments").insert({
      organization_id: profile?.organization_id,
      branch_id: profile?.branch_id ?? null,
      order_id: data.id,
      customer_id,
      amount: initialPayment,
      method: String(formData.get("payment_method") || "Cash"),
      type: String(formData.get("payment_type") || "Deposit"),
    });
    if (paymentError) throw new Error(paymentError.message);
    const { error: amountError } = await supabase
      .from("custom_orders")
      .update({ amount_paid: initialPayment })
      .eq("id", data.id);
    if (amountError) throw new Error(amountError.message);
  }

  const measurementAction = String(formData.get("measurement_action") ?? "skip");
  if (measurementAction === "save") {
    const num = (key: string) => (formData.get(key) ? Number(formData.get(key)) : null);
    const hasAnyValue = ["chest", "waist", "hips", "shoulder", "sleeve_length", "garment_length"].some(
      (key) => formData.get(key) && String(formData.get(key)).trim() !== ""
    );
    if (hasAnyValue) {
      const { error: measurementError } = await supabase.from("measurements").insert({
        organization_id: profile?.organization_id,
        customer_id,
        label: (formData.get("measurement_label") as string) || "Standard",
        chest: num("chest"),
        waist: num("waist"),
        hips: num("hips"),
        shoulder: num("shoulder"),
        sleeve_length: num("sleeve_length"),
        garment_length: num("garment_length"),
        notes: formData.get("measurement_notes") || null,
      });
      if (measurementError) throw new Error(measurementError.message);
      revalidatePath("/measurements");
      revalidatePath(`/customers/${customer_id}`);
    }
  }

  revalidatePath("/orders");
  revalidatePath("/payments");
  redirect(`/orders/${data.id}/confirmation`);
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
  const amount = Number(formData.get("amount") || 0);
  if (!order_id || !Number.isFinite(amount) || amount <= 0) throw new Error("A valid amount is required");

  const { data: order } = await supabase
    .from("custom_orders")
    .select("customer_id, total_amount, amount_paid")
    .eq("id", order_id)
    .eq("organization_id", profile?.organization_id ?? "")
    .single();
  if (!order) throw new Error("Order not found.");
  const outstanding = Math.max(0, Number(order.total_amount) - Number(order.amount_paid));
  if (amount > outstanding) throw new Error(`Payment cannot be more than the outstanding balance of ₵${outstanding.toFixed(2)}.`);

  const { error: payErr } = await supabase.from("payments").insert({
    organization_id: profile?.organization_id,
    branch_id: profile?.branch_id ?? null,
    order_id,
    customer_id: order.customer_id,
    amount,
    method: (formData.get("method") as string) || "Cash",
    type: (formData.get("type") as string) || "Deposit",
    notes: formData.get("notes") || null,
  });
  if (payErr) throw new Error(payErr.message);

  const { error: updErr } = await supabase
    .from("custom_orders")
    .update({ amount_paid: Number(order?.amount_paid ?? 0) + amount })
    .eq("id", order_id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/orders/${order_id}`);
  revalidatePath("/payments");
}
