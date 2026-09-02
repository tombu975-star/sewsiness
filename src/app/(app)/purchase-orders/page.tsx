import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StatusSelect } from "./StatusSelect";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function PurchaseOrdersPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: pos } = await supabase
    .from("purchase_orders")
    .select("id, reference, total, status, suppliers(name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (pos ?? []) as any[];

  return (
    <div>
      <PageHead title="Purchase Orders" subtitle={`${rows.length} raised · POs against suppliers, with receiving status`} crumb="Purchases / Purchase Orders" actions={<Button href="/purchase-orders/new">+ New PO</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="◫" title="No purchase orders yet." description="Add suppliers first, then raise a purchase order against one." actionLabel="New PO" actionHref="/purchase-orders/new" />
      ) : (
        <DataTable
          columns={[{ key: "ref", label: "Reference" }, { key: "supplier", label: "Supplier" }, { key: "total", label: "Total" }, { key: "status", label: "Status" }]}
          rows={rows.map((p) => ({ id: p.id, cells: { ref: p.reference ?? "—", supplier: p.suppliers?.name ?? "—", total: `₵${Number(p.total).toFixed(2)}`, status: <StatusSelect id={p.id} current={p.status} /> } }))}
        />
      )}
    </div>
  );
}
