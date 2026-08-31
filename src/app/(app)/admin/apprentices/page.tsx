import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function PlatformApprenticesPage() {
  await requirePageRole(["super_admin"]);
  const supabase = createClient();

  // RLS ("super admin can read all ...") on profiles, apprentice_profiles
  // and training_tasks is what makes each of these cross-tenant selects
  // possible. Aggregated only — no business's individual training
  // records or notes are surfaced here.
  const [{ data: apprentices }, { data: trainers }, { data: tasks }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, organization_id, created_at, organization:organization_id(name), apprentice_profiles(training_level, start_date)")
      .eq("role", "apprentice"),
    supabase.from("profiles").select("id, organization_id").eq("role", "trainer"),
    supabase.from("training_tasks").select("id, status, organization_id"),
  ]);

  const apprenticeRows = (apprentices ?? []) as any[];
  const trainerRows = (trainers ?? []) as any[];
  const taskRows = (tasks ?? []) as any[];

  const businessesWithApprentices = new Set(apprenticeRows.map((a) => a.organization_id)).size;
  const doneTasks = taskRows.filter((t) => t.status === "Done").length;
  const completionRate = taskRows.length ? Math.round((doneTasks / taskRows.length) * 100) : null;

  // Per-business breakdown for the table below.
  const byOrg = new Map<string, { name: string; apprentices: number; tasks: number; done: number }>();
  for (const a of apprenticeRows) {
    const key = a.organization_id;
    const name = a.organization?.name ?? "Unknown business";
    if (!byOrg.has(key)) byOrg.set(key, { name, apprentices: 0, tasks: 0, done: 0 });
    byOrg.get(key)!.apprentices += 1;
  }
  for (const t of taskRows) {
    const entry = byOrg.get(t.organization_id);
    if (!entry) continue;
    entry.tasks += 1;
    if (t.status === "Done") entry.done += 1;
  }
  const orgRows = Array.from(byOrg.values()).sort((a, b) => b.apprentices - a.apprentices);

  return (
    <div>
      <PageHead
        title="Apprentices & Trainers"
        subtitle="Aggregated training activity across every business. Individual training notes and portfolios stay with each business."
        crumb="Platform Admin"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Apprentices" value={apprenticeRows.length} />
        <StatCard label="Businesses w/ Apprentices" value={businessesWithApprentices} />
        <StatCard label="Total Trainers" value={trainerRows.length} />
        <StatCard label="Task Completion Rate" value={completionRate === null ? "—" : `${completionRate}%`} accent />
      </div>

      {orgRows.length === 0 ? (
        <EmptyState icon="⚘" title="No apprentices enrolled on the platform yet." description="This fills in once businesses invite their first apprentices." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sunken text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Business</th>
                <th className="text-left px-4 py-2.5 font-medium">Apprentices</th>
                <th className="text-left px-4 py-2.5 font-medium">Training Tasks</th>
                <th className="text-left px-4 py-2.5 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {orgRows.map((o) => (
                <tr key={o.name} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-ink">{o.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{o.apprentices}</td>
                  <td className="px-4 py-3 text-ink-muted">{o.tasks}</td>
                  <td className="px-4 py-3 text-ink-muted">{o.tasks ? `${o.done}/${o.tasks}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
