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

  // Measurements step: "new" saves a fresh set to the customer's profile
  // (same insert saveMeasurement does in measurements/actions.ts — kept
  // as a plain insert here rather than calling that action directly,
  // since it redirects on its own and this flow has its own redirect to
  // do afterward). "existing"/"skip" need no write — the chosen set
  // already exists, or there's nothing to record yet.
  const measurementMode = String(formData.get("measurement_mode") ?? "skip");
  if (measurementMode === "new") {
    const num = (key: string) => (formData.get(key) ? Number(formData.get(key)) : null);
    const { error: measurementError } = await supabase.from("measurements").insert({
      customer_id,
      organization_id: profile?.organization_id,
      label: (formData.get("measurement_label") as string) || "Standard",
      chest: num("measurement_chest"),
      waist: num("measurement_waist"),
      hips: num("measurement_hips"),
      shoulder: num("measurement_shoulder"),
      sleeve_length: num("measurement_sleeve_length"),
      garment_length: num("measurement_garment_length"),
      notes: formData.get("measurement_notes") || null,
    });
    if (measurementError) throw new Error(measurementError.message);
    revalidatePath("/measurements");
  }

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

  revalidatePath("/orders");
  revalidatePath("/payments");
  redirect(`/orders/${data.id}?created=1`);
}

// Used only by the "Start Production" action on the just-created-order
// confirmation banner (see orders/[id]/page.tsx). Same write ProductionTab's
// advanceStage makes for the first stage, but this one redirects straight
// into the Production tab afterward instead of just revalidating in place
// — the point of that button is to land you looking at the result, not
// back on the Payments tab wondering if anything happened.
export async function startOrderProduction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const order_id = String(formData.get("order_id") ?? "");
  if (!order_id) throw new Error("Missing order.");

  const { data: existing } = await supabase
    .from("production_stages")
    .select("id")
    .eq("order_id", order_id)
    .eq("stage", "Cutting")
    .maybeSingle();

  if (existing) {
    await supabase.from("production_stages").update({ status: "In Progress", updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await supabase.from("production_stages").insert({ order_id, organization_id: profile?.organization_id, stage: "Cutting", status: "In Progress" });
  }

  // Same status sync as advanceStage in production/actions.ts — starting
  // production from this confirmation banner shouldn't leave the order
  // sitting on "Pending" either.
  const { data: order } = await supabase.from("custom_orders").select("status").eq("id", order_id).maybeSingle();
  if (order?.status === "Pending") {
    await supabase.from("custom_orders").update({ status: "In Progress" }).eq("id", order_id);
  }

  revalidatePath(`/orders/${order_id}`);
  revalidatePath("/production");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect(`/orders/${order_id}?tab=production`);
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
