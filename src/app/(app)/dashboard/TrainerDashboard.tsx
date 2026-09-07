import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

// Trainer has no POS/Orders/Customers access at all (see nav.ts — those
// sidebar groups list only owner/manager/staff), so unlike Staff's
// dashboard, nothing here reaches for shop-floor data. It's scoped to
// exactly what a Trainer's own sidebar reaches: their assigned
// apprentices (Apprentices, Trainer Console) and those apprentices'
// task/portfolio progress (Training Plans, Portfolios).
export async function TrainerDashboard({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, organization_id")
    .eq("id", userId)
    .single();

  const orgId = profile?.organization_id;

  const { data: apprentices } = await supabase
    .from("apprentice_profiles")
    .select("profile_id, training_level, specialisation, profiles:profile_id(full_name)")
    .eq("organization_id", orgId ?? "")
    .eq("trainer_id", userId);

  const rows = (apprentices ?? []) as any[];
  const apprenticeIds = rows.map((a) => a.profile_id);

  const { data: tasks } = apprenticeIds.length
    ? await supabase.from("training_tasks").select("id, apprentice_id, title, status, due_date").in("apprentice_id", apprenticeIds)
    : { data: [] };

  const taskRows = (tasks ?? []) as any[];
  const doneCount = taskRows.filter((t) => t.status === "Done").length;
  const openTasks = taskRows
    .filter((t) => t.status !== "Done")
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
    .slice(0, 6);
  const nameById = new Map(rows.map((a) => [a.profile_id, a.profiles?.full_name]));

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHead
        crumb={`Trainer · Today, ${today}`}
        title={`Good day, ${firstName}`}
        subtitle="Your apprentices' progress, at a glance."
        actions={
          <Button href="/trainer-console" variant="outline">
            Open Trainer Console
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="My Apprentices" value={rows.length} icon="◎" />
        <StatCard label="Tasks Completed" value={doneCount} accent icon="✓" />
        <StatCard label="Open Tasks" value={taskRows.length - doneCount} icon="◔" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">Open Tasks</h2>
            <a href="/training-plans" className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <span aria-hidden="true">→</span>
            </a>
          </div>
          <DataTable
            columns={[
              { key: "apprentice", label: "Apprentice" },
              { key: "task", label: "Task" },
              { key: "due", label: "Due" },
              { key: "status", label: "Status", isStatus: true },
            ]}
            rows={openTasks.map((t) => ({
              id: t.id,
              href: "/training-plans",
              cells: {
                apprentice: nameById.get(t.apprentice_id) ?? "—",
                task: t.title,
                due: t.due_date ?? "—",
                status: t.status,
              },
            }))}
            emptyLabel="No open tasks — every apprentice is caught up."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">My Apprentices</h2>
            <a href="/apprentices" className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <span aria-hidden="true">→</span>
            </a>
          </div>
          {rows.length === 0 ? (
            <EmptyState icon="◎" title="No apprentices assigned yet." description="Apprentices assigned to you as trainer will appear here." />
          ) : (
            <div className="card divide-y divide-border">
              {rows.map((a) => (
                <div key={a.profile_id} className="p-3.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-ink">{a.profiles?.full_name}</div>
                    <div className="text-xs text-ink-muted">{a.specialisation ?? "No specialisation set"}</div>
                  </div>
                  <div className="text-xs font-semibold text-ink-soft bg-sunken px-2 py-1 rounded-md">{a.training_level ?? "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
