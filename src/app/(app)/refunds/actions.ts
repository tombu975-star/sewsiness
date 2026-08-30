"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function issueRefund(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id, branch_id").eq("id", user.id).single();

  const amount = Number(formData.get("amount") || 0);
  if (amount <= 0) throw new Error("A valid refund amount is required.");

  const { error } = await supabase.from("payments").insert({
    organization_id: profile?.organization_id,
    branch_id: profile?.branch_id ?? null,
    customer_id: formData.get("customer_id") || null,
    order_id: formData.get("order_id") || null,
    amount: -Math.abs(amount),
    method: (formData.get("method") as string) || "Cash",
    type: "Refund",
    notes: formData.get("reason") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/refunds");
  redirect("/refunds");
}
