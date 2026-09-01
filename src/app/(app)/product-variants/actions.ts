"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createVariant(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const product_id = String(formData.get("product_id") ?? "");
  if (!product_id) throw new Error("A product is required.");

  const { error } = await supabase.from("product_variants").insert({
    product_id,
    organization_id: profile?.organization_id,
    size: formData.get("size") || null,
    color: formData.get("color") || null,
    stock_qty: Number(formData.get("stock_qty") || 0),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/product-variants");
  redirect("/product-variants");
}
