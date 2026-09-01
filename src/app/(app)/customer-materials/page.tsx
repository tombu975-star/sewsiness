import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";

export default async function CustomerMaterialsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: materials } = await supabase
    .from("customer_materials")
    .select("id, description, quantity, received_at, returned, customers(id, full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("received_at", { ascending: false });

  const rows = (materials ?? []) as any[];

  return (
    <div>
      <PageHead title="Customer Materials" subtitle={`${rows.length} logged · chain-of-custody for fabric customers supply themselves`} crumb="Customers / Customer Materials" />
      {rows.length === 0 ? (
        <EmptyState icon="◧" title="No customer-supplied materials logged." description="Log materials from an individual customer's profile page." />
      ) : (
        <DataTable
          columns={[{ key: "customer", label: "Customer" }, { key: "description", label: "Material" }, { key: "quantity", label: "Quantity" }, { key: "received", label: "Received" }, { key: "status", label: "Status" }]}
          rows={rows.map((m) => ({
            id: m.id,
            href: `/customers/${m.customers?.id}`,
            cells: { customer: m.customers?.full_name ?? "—", description: m.description, quantity: m.quantity ?? "—", received: m.received_at, status: <StatusBadge value={m.returned ? "Completed" : "Pending"} /> },
          }))}
        />
      )}
    </div>
  );
}
