import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function StaffPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, role, branches(name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .in("role", ["owner", "manager", "staff", "trainer"])
    .order("full_name");

  const rows = (staff ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Staff"
        subtitle={`${rows.length} on team · Owner and Manager can both add staff directly — no approval required`}
        crumb="Staff"
        actions={<Button href="/staff/new">+ Invite Staff</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState icon="☺" title="No staff yet." description="Invite a staff member — they'll receive an email to set their own password and sign in." actionLabel="Invite Staff" actionHref="/staff/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "branch", label: "Branch" }]}
          rows={rows.map((s) => ({ id: s.id, cells: { name: s.full_name, role: s.role, branch: s.branches?.name ?? "—" } }))}
        />
      )}
    </div>
  );
}
