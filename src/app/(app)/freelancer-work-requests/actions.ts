"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createWorkRequest(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const freelancer_id = String(formData.get("freelancer_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!freelancer_id || !title) throw new Error("Freelancer and job title are required.");

  const { error } = await supabase.from("work_requests").insert({
    freelancer_id,
    organization_id: profile?.organization_id,
    title,
    amount: Number(formData.get("amount") || 0),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/freelancer-work-requests");
  redirect("/freelancer-work-requests");
}

export async function updateWorkRequestStatus(id: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from("work_requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/freelancer-work-requests");
  revalidatePath("/freelancer-payments");
}
