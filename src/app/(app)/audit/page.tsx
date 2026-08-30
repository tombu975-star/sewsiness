import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

export default async function AuditLogPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isSuperAdmin = profile?.role === "super_admin";

  if (!["owner", "super_admin"].includes(profile?.role ?? "")) {
    return (
      <div>
        <PageHead title="Audit Log" crumb="Audit Logs" />
        <div className="card p-10 text-center text-sm text-ink-muted">The audit log is visible only to Owner and Super Admin.</div>
      </div>
    );
  }

  // Super Admin sees every business's log (RLS: "super admin can read all
  // audit logs"); Owner only ever sees their own business's rows.
  let query = supabase
    .from("audit_logs")
    .select("id, action, entity, created_at, actor:actor_id(full_name), organization:organization_id(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!isSuperAdmin) query = query.eq("organization_id", profile?.organization_id ?? "");
  const { data: logs, error } = await query;

  const rows = (logs ?? []) as any[];

  return (
    <div>
      <PageHead
        title={isSuperAdmin ? "Audit & Security" : "Audit Log"}
        subtitle={isSuperAdmin ? "Every sensitive platform action, across every business." : "Immutable log of who changed what, and when."}
        crumb="Audit Logs"
      />
      {error && (
        <div className="callout mb-4">Couldn&rsquo;t load the audit log ({error.message}).</div>
      )}
      {!error && rows.length === 0 ? (
        <EmptyState icon="▤" title="No audit entries yet." description="Sensitive actions (business enrollment, suspensions, invites, role changes) will show up here as they happen." />
      ) : (
        <DataTable
          columns={
            isSuperAdmin
              ? [{ key: "actor", label: "Actor" }, { key: "action", label: "Action" }, { key: "business", label: "Business" }, { key: "entity", label: "Entity" }, { key: "date", label: "Date" }]
              : [{ key: "actor", label: "Actor" }, { key: "action", label: "Action" }, { key: "entity", label: "Entity" }, { key: "date", label: "Date" }]
          }
          rows={rows.map((l) => ({
            id: l.id,
            cells: {
              actor: l.actor?.full_name ?? "System",
              action: l.action,
              entity: l.entity,
              business: l.organization?.name ?? "—",
              date: new Date(l.created_at).toLocaleString(),
            },
          }))}
        />
      )}
    </div>
  );
}
