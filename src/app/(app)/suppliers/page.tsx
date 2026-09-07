import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function SuppliersPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, phone, email")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("name");

  const rows = (suppliers ?? []) as any[];

  return (
    <div>
      <PageHead title="Suppliers" subtitle={`${rows.length} in directory · fabric, trims and materials suppliers`} crumb="Purchases / Suppliers" actions={<Button href="/suppliers/new">+ New Supplier</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="◫" title="No suppliers yet." description="Add a supplier to start raising purchase orders against them." actionLabel="New Supplier" actionHref="/suppliers/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Supplier" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" }]}
          rows={rows.map((s) => ({ id: s.id, cells: { name: s.name, phone: s.phone ?? "—", email: s.email ?? "—" } }))}
        />
      )}
    </div>
  );
}
