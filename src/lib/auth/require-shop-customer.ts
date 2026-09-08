import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the signed-in shopper's own shop_customers row. Redirects to
 * /shop/login (never /login — that's the staff sign-in and expects a
 * profiles row) if there's no session or no linked account yet.
 *
 * Mirrors requireProfile() in lib/auth/require-role.ts, but for the
 * marketplace's own, separate identity: a shop_customers row is never
 * scoped to one organization the way a staff profile is, since a
 * shopper can order from many different ateliers.
 */
export async function requireShopCustomer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/shop/login");

  const { data: customer } = await supabase
    .from("shop_customers")
    .select("id, full_name, phone, email")
    .eq("id", user.id)
    .single();
  if (!customer) redirect("/shop/login");

  return { user, customer };
}

/**
 * Same lookup, but returns null instead of redirecting — for pages that
 * render differently for a signed-in shopper vs. a browsing visitor
 * (e.g. the home page greeting) rather than requiring an account.
 */
export async function getShopCustomer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: customer } = await supabase
    .from("shop_customers")
    .select("id, full_name, phone, email")
    .eq("id", user.id)
    .single();
  return customer ? { user, customer } : null;
}
