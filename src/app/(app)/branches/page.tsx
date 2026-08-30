import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function BranchesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, city")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("name");

  const rows = (branches ?? []) as any[];

  const withCounts = await Promise.all(
    rows.map(async (b) => {
      const [{ count: staffCount }, { count: orderCount }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("branch_id", b.id),
        supabase.from("custom_orders").select("*", { count: "exact", head: true }).eq("branch_id", b.id),
      ]);
      return { ...b, staffCount: staffCount ?? 0, orderCount: orderCount ?? 0 };
    })
  );

  return (
    <div>
      <PageHead title="Branches" subtitle={`${rows.length} · directory with staff and order rollups`} crumb="Branches" actions={<Button href="/branches/new">+ New Branch</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="⌂" title="No branches yet." description="Add your first branch — customers, orders and staff can all be scoped to it." actionLabel="New Branch" actionHref="/branches/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Branch" }, { key: "city", label: "City" }, { key: "staff", label: "Staff" }, { key: "orders", label: "Orders" }]}
          rows={withCounts.map((b) => ({ id: b.id, cells: { name: b.name, city: b.city ?? "—", staff: b.staffCount, orders: b.orderCount } }))}
        />
      )}
    </div>
  );
}
