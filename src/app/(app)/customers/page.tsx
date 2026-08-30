import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function CustomersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user!.id)
    .single();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, phone, status, branches(name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (customers ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Customers"
        subtitle={`${rows.length} total · every record connects to Orders, Payments and Reports`}
        crumb="Customers"
        actions={<Button href="/customers/new">+ New Customer</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="⚉"
          title="No customers yet."
          description="Add your first customer to start using this module — everything else in Sewiness connects from here."
          actionLabel="New Customer"
          actionHref="/customers/new"
        />
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Customer" },
            { key: "phone", label: "Phone" },
            { key: "branch", label: "Branch" },
            { key: "status", label: "Status", isStatus: true },
          ]}
          rows={rows.map((c) => ({
            id: c.id,
            href: `/customers/${c.id}`,
            cells: {
              name: c.full_name,
              phone: c.phone ?? "—",
              branch: c.branches?.name ?? "—",
              status: c.status,
            },
          }))}
        />
      )}
    </div>
  );
}
