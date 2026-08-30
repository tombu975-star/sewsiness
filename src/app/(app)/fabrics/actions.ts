"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createFabric(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Fabric name is required.");

  const { error } = await supabase.from("fabrics").insert({
    organization_id: profile?.organization_id,
    name,
    type: formData.get("type") || null,
    color: formData.get("color") || null,
    price_per_yard: Number(formData.get("price_per_yard") || 0),
    stock_yards: Number(formData.get("stock_yards") || 0),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/fabrics");
  redirect("/fabrics");
}

export async function adjustFabricStock(id: string, delta: number) {
  const supabase = createClient();
  const { data: fabric } = await supabase.from("fabrics").select("stock_yards").eq("id", id).single();
  const next = Math.max(0, Number(fabric?.stock_yards ?? 0) + delta);
  const { error } = await supabase.from("fabrics").update({ stock_yards: next }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/fabrics");
}
