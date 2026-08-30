"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createExpense(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id, branch_id").eq("id", user.id).single();

  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") || 0);
  if (!category || amount <= 0) throw new Error("Category and a valid amount are required.");

  const { error } = await supabase.from("expenses").insert({
    organization_id: profile?.organization_id,
    branch_id: profile?.branch_id ?? null,
    category,
    amount,
    method: (formData.get("method") as string) || "Cash",
    notes: formData.get("notes") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  redirect("/expenses");
}
