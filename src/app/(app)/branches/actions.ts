"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createBranch(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Branch name is required.");

  const { error } = await supabase.from("branches").insert({
    organization_id: profile?.organization_id,
    name,
    city: formData.get("city") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/branches");
  redirect("/branches");
}
