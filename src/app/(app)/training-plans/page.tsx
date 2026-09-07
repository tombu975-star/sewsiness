import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { assignTask } from "./actions";
import { TaskSubmissionForm } from "./TaskSubmissionForm";
import { TaskReviewForm } from "./TaskReviewForm";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function TrainingPlansPage() {
  await requirePageRole(["owner", "manager", "trainer", "apprentice"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isApprentice = profile?.role === "apprentice";

  let query = supabase
    .from("training_tasks")
    .select("id, title, status, due_date, submission_text, score, feedback, module:module_id(title, sequence, program:program_id(name)), enrollment:enrollment_id(program_id), apprentice:apprentice_id(id, full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });
  if (isApprentice) query = query.eq("apprentice_id", user!.id);
  const { data: tasks } = await query;
  const rows = (tasks ?? []) as any[];

  const { data: apprentices } = isApprentice
    ? { data: [] }
    : await supabase.from("profiles").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").eq("role", "apprentice").order("full_name");
  const { data: modules } = isApprentice
    ? { data: [] }
    : await supabase.from("training_modules").select("id, title, sequence, program:program_id(name)").eq("organization_id", profile?.organization_id ?? "").order("sequence");
  const { data: enrollments } = isApprentice
    ? { data: [] }
    : await supabase.from("program_enrollments").select("id, apprentice_id, program:program_id(name)").eq("organization_id", profile?.organization_id ?? "").eq("status", "active");

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
          <div className="min-w-[180px]">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Curriculum module</label>
            <select name="module_id" className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold">
              <option value="">Standalone task</option>
              {(modules ?? []).map((module: any) => <option key={module.id} value={module.id}>{module.program?.name} · Unit {module.sequence}: {module.title}</option>)}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-semibold text-ink-muted mb-1">Enrollment</label>
            <select name="enrollment_id" className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-gold">
              <option value="">Select enrollment</option>
              {(enrollments ?? []).map((enrollment: any) => <option key={enrollment.id} value={enrollment.id}>{enrollment.program?.name} · {enrollment.apprentice_id.slice(0, 8)}</option>)}
            </select>
          </div>
          <SubmitButton pendingLabel="Assigning…">Assign</SubmitButton>
        </form>
      )}

      {rows.length === 0 ? (
        <EmptyState icon="✎" title="No tasks yet." description={isApprentice ? "Your trainer hasn't assigned any tasks yet." : "Assign your first task to an apprentice."} />
      ) : (
        <div className="card divide-y divide-border">
          {rows.map((t) => (
            <div key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{t.title}</div>
                  <div className="text-xs text-ink-muted">
                    {!isApprentice && `${t.apprentice?.full_name} · `}
                    {t.due_date ? `Due ${t.due_date}` : "No due date"}
                    {t.module && ` · ${t.module.program?.name} / Unit ${t.module.sequence}: ${t.module.title}`}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold text-ink">{t.status}</span>
              </div>
              {isApprentice && ["Assigned", "In Progress", "Needs Changes"].includes(t.status) && (
                <TaskSubmissionForm taskId={t.id} existing={t.submission_text} />
              )}
              {!isApprentice && t.status === "Submitted" && (
                <div className="mt-3 border-t border-border pt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Apprentice submission</div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{t.submission_text}</p>
                  <TaskReviewForm taskId={t.id} />
                </div>
              )}
              {isApprentice && t.feedback && (
                <p className="mt-3 border-t border-border pt-3 text-xs text-ink-muted"><strong>Trainer feedback:</strong> {t.feedback}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
