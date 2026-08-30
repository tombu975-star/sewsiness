"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function assignTask(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const apprentice_id = String(formData.get("apprentice_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!apprentice_id || !title) throw new Error("Apprentice and task title are required.");

  const { error } = await supabase.from("training_tasks").insert({
    apprentice_id,
    organization_id: profile?.organization_id,
    title,
    due_date: formData.get("due_date") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/training-plans");
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from("training_tasks").update({ status }).eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath("/training-plans");
}
