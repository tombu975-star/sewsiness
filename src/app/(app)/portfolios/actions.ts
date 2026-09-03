"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPortfolioItem(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("A title is required.");

  const apprentice_id = profile?.role === "apprentice" ? user.id : String(formData.get("apprentice_id") ?? user.id);
  const image_url = String(formData.get("image_url") ?? "").trim();

  const { error } = await supabase.from("portfolio_items").insert({
    apprentice_id,
    organization_id: profile?.organization_id,
    title,
    description: formData.get("description") || null,
    image_url: image_url || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/portfolios");
  redirect("/portfolios");
}
