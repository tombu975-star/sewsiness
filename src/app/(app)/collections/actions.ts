"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCollection(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Collection name is required.");

  const { error } = await supabase.from("collections").insert({
    organization_id: profile?.organization_id,
    name,
    season: formData.get("season") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/collections");
  redirect("/collections");
}
