import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { PosTerminal } from "./PosTerminal";

export default async function PosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, selling_price, stock_qty, category")
      .eq("organization_id", profile?.organization_id ?? "")
      .gt("stock_qty", 0)
      .order("name"),
    supabase.from("customers").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").order("full_name"),
  ]);

  return (
    <div>
      <PageHead title="Point of Sale" subtitle="Ring up ready-to-wear and accessory sales." crumb="POS" />
      <PosTerminal products={products ?? []} customers={customers ?? []} />
    </div>
  );
}
