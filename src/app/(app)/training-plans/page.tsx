import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { assignTask } from "./actions";
import { TaskStatusSelect } from "./TaskStatusSelect";

export default async function TrainingPlansPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isApprentice = profile?.role === "apprentice";

  let query = supabase
    .from("training_tasks")
    .select("id, title, status, due_date, apprentice:apprentice_id(id, full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });
  if (isApprentice) query = query.eq("apprentice_id", user!.id);
  const { data: tasks } = await query;
  const rows = (tasks ?? []) as any[];

  const { data: apprentices } = isApprentice
    ? { data: [] }
    : await supabase.from("profiles").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").eq("role", "apprentice").order("full_name");

  return (
    <div>
      <PageHead
        title={isApprentice ? "My Tasks" : "Training Plans"}
        subtitle={isApprentice ? "Tasks assigned to you by your trainer." : "Structured skill stages and tasks assigned to apprentices."}
        crumb="Apprentices / Training Plans"
      />

      {!isApprentice && (
        <form action={assignTask} className="card p-4 mb-6 flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Apprentice</label>
            <select name="apprentice_id" required className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold">
              <option value="" disabled selected>Select…</option>
              {(apprentices ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Task</label>
            <input name="title" required placeholder="e.g. Practice French seams" className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Due date</label>
            <input name="due_date" type="date" className="rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <SubmitButton pendingLabel="Assigning…">Assign</SubmitButton>
        </form>
      )}

      {rows.length === 0 ? (
        <EmptyState icon="✎" title="No tasks yet." description={isApprentice ? "Your trainer hasn't assigned any tasks yet." : "Assign your first task to an apprentice."} />
      ) : (
        <div className="card divide-y divide-border">
          {rows.map((t) => (
            <div key={t.id} className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-ink">{t.title}</div>
                <div className="text-xs text-ink-muted">
                  {!isApprentice && `${t.apprentice?.full_name} · `}
                  {t.due_date ? `Due ${t.due_date}` : "No due date"}
                </div>
              </div>
              <TaskStatusSelect taskId={t.id} current={t.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
