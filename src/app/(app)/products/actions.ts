"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function statusFromStock(qty: number): string {
  if (qty <= 0) return "Out of Stock";
  if (qty <= 5) return "Low Stock";
  return "Active";
}

export async function createProduct(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Product name is required");

  const stock_qty = Number(formData.get("stock_qty") || 0);

  const { data, error } = await supabase
    .from("products")
    .insert({
      organization_id: profile?.organization_id,
      name,
      category: formData.get("category") || null,
      brand: formData.get("brand") || null,
      sku: formData.get("sku") || null,
      selling_price: Number(formData.get("selling_price") || 0),
      cost_price: formData.get("cost_price") ? Number(formData.get("cost_price")) : null,
      stock_qty,
      status: statusFromStock(stock_qty),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  redirect(`/products/${data.id}`);
}

export async function adjustStock(productId: string, delta: number) {
  const supabase = createClient();
  const { data: product } = await supabase.from("products").select("stock_qty").eq("id", productId).single();
  const next = Math.max(0, Number(product?.stock_qty ?? 0) + delta);
  const { error } = await supabase
    .from("products")
    .update({ stock_qty: next, status: statusFromStock(next) })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
}
