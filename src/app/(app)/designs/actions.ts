"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDesign(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Design name is required.");

  const { error } = await supabase.from("designs").insert({
    organization_id: profile?.organization_id,
    name,
    category: formData.get("category") || null,
    price: Number(formData.get("price") || 0),
    lead_time_days: formData.get("lead_time_days") ? Number(formData.get("lead_time_days")) : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/designs");
  redirect("/designs");
}
