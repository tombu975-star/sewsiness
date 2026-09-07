import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function DesignsPage() {
  await requirePageRole(["owner", "manager", "staff"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: designs } = await supabase
    .from("designs")
    .select("id, name, category, price, lead_time_days")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("name");

  const rows = (designs ?? []) as any[];

  return (
    <div>
      <PageHead title="Designs" subtitle={`${rows.length} in catalogue · reusable designs with pricing and lead time`} crumb="Dressmaking / Designs" actions={<Button href="/designs/new">+ New Design</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="✎" title="No designs yet." description="Add a reusable design to speed up costing and order creation." actionLabel="New Design" actionHref="/designs/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Design" }, { key: "category", label: "Category" }, { key: "price", label: "Price" }, { key: "lead", label: "Lead Time" }]}
          rows={rows.map((d) => ({ id: d.id, cells: { name: d.name, category: d.category ?? "—", price: `₵${Number(d.price).toFixed(2)}`, lead: d.lead_time_days ? `${d.lead_time_days} days` : "—" } }))}
        />
      )}
    </div>
  );
}
