import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

export default async function MeasurementsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: measurements } = await supabase
    .from("measurements")
    .select("id, label, chest, waist, hips, created_at, customers(id, full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (measurements ?? []) as any[];

  return (
    <div>
      <PageHead title="Measurements" subtitle={`${rows.length} sets recorded · add new sets from a customer's profile`} crumb="Customers / Measurements" />
      {rows.length === 0 ? (
        <EmptyState icon="⚭" title="No measurements yet." description="Record measurement sets from an individual customer's profile page." />
      ) : (
        <DataTable
          columns={[{ key: "customer", label: "Customer" }, { key: "label", label: "Set" }, { key: "chest", label: "Chest" }, { key: "waist", label: "Waist" }, { key: "hips", label: "Hips" }, { key: "date", label: "Recorded" }]}
          rows={rows.map((m) => ({ id: m.id, href: `/customers/${m.customers?.id}`, cells: { customer: m.customers?.full_name ?? "—", label: m.label, chest: m.chest ?? "—", waist: m.waist ?? "—", hips: m.hips ?? "—", date: new Date(m.created_at).toLocaleDateString() } }))}
        />
      )}
    </div>
  );
}
