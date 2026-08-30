"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CartLine {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

function generateSaleNumber() {
  const n = Math.floor(10000 + Math.random() * 89999);
  return `POS-${n}`;
}

export async function completeSale(input: {
  lines: CartLine[];
  customer_id: string | null;
  method: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  if (input.lines.length === 0) throw new Error("Cart is empty");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, branch_id")
    .eq("id", user.id)
    .single();

  const total = input.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  const { data: sale, error: saleErr } = await supabase
    .from("pos_sales")
    .insert({
      sale_number: generateSaleNumber(),
      organization_id: profile?.organization_id,
      branch_id: profile?.branch_id ?? null,
      customer_id: input.customer_id,
      cashier_id: user.id,
      subtotal: total,
      total,
      status: "Completed",
    })
    .select("id, sale_number")
    .single();
  if (saleErr) throw new Error(saleErr.message);

  const items = input.lines.map((l) => ({
    pos_sale_id: sale.id,
    product_id: l.product_id,
    quantity: l.quantity,
    unit_price: l.unit_price,
    line_total: l.quantity * l.unit_price,
  }));
  const { error: itemsErr } = await supabase.from("pos_sale_items").insert(items);
  if (itemsErr) throw new Error(itemsErr.message);

  if (total > 0) {
    await supabase.from("payments").insert({
      organization_id: profile?.organization_id,
      branch_id: profile?.branch_id ?? null,
      customer_id: input.customer_id,
      pos_sale_id: sale.id,
      amount: total,
      method: input.method,
      type: "Sale",
    });
  }

  for (const line of input.lines) {
    const { data: product } = await supabase.from("products").select("stock_qty").eq("id", line.product_id).single();
    const nextQty = Math.max(0, Number(product?.stock_qty ?? 0) - line.quantity);
    const status = nextQty <= 0 ? "Out of Stock" : nextQty <= 5 ? "Low Stock" : "Active";
    await supabase.from("products").update({ stock_qty: nextQty, status }).eq("id", line.product_id);
  }

  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/payments");
  revalidatePath("/dashboard");

  return { saleNumber: sale.sale_number, total };
}
