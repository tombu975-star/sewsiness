import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { createTrainingModule, createTrainingProgram, enrollApprentice } from "./actions";

export default async function TrainingProgramsPage() {
  const { user, profile } = await requirePageRegistryFeature(["owner", "manager", "trainer", "apprentice"], "apprentices");
  const supabase = createClient();
  const canManage = profile.role === "owner" || profile.role === "manager";

  const [{ data: programs }, { data: modules }, { data: enrollments }, { data: apprentices }, { data: trainers }] = await Promise.all([
    supabase.from("training_programs").select("id, name, description, program_type, duration_weeks, pass_score, is_active").eq("organization_id", profile.organization_id).eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("training_modules").select("id, program_id, title, description, sequence").eq("organization_id", profile.organization_id).order("sequence"),
    supabase.from("program_enrollments").select("id, program_id, apprentice_id, trainer_id, status, institution_name, institution_student_id, final_score, apprentice:apprentice_id(full_name), trainer:trainer_id(full_name)").eq("organization_id", profile.organization_id).eq("status", "active"),
    canManage ? supabase.from("profiles").select("id, full_name").eq("organization_id", profile.organization_id).eq("role", "apprentice").order("full_name") : Promise.resolve({ data: [] as any[] }),
    canManage ? supabase.from("profiles").select("id, full_name").eq("organization_id", profile.organization_id).eq("role", "trainer").order("full_name") : Promise.resolve({ data: [] as any[] }),
  ]);

  const visibleEnrollments = (enrollments ?? []).filter((enrollment: any) => {
    if (profile.role === "apprentice") return enrollment.apprentice_id === user.id;
    if (profile.role === "trainer") return enrollment.trainer_id === user.id;
    return true;
  }) as any[];
  const moduleRows = (modules ?? []) as any[];

  return (
    <div>
      <PageHead title={profile.role === "apprentice" ? "My Learning" : "Training Programs"} subtitle="Competency-based learning pathways for workplace and TVET training." crumb="Learning" />

      {canManage && (
        <form action={createTrainingProgram} className="card p-5 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2"><label className="field-label">Program name</label><input name="name" required placeholder="e.g. Garment Construction Level 1" className="field-input" /></div>
          <div><label className="field-label">Standard</label><select name="program_type" className="field-input"><option value="tvet">TVET</option><option value="workplace">Workplace</option></select></div>
          <div><label className="field-label">Weeks</label><input name="duration_weeks" type="number" min="1" required defaultValue="12" className="field-input" /></div>
          <div><label className="field-label">Pass score %</label><input name="pass_score" type="number" min="0" max="100" required defaultValue="70" className="field-input" /></div>
          <SubmitButton>Create program</SubmitButton>
          <div className="md:col-span-6"><label className="field-label">Description</label><textarea name="description" rows={2} placeholder="What competencies will the learner develop?" className="field-input" /></div>
        </form>
      )}

      {(programs ?? []).length === 0 ? <EmptyState icon="◎" title="No learning programs yet." description={canManage ? "Create the first competency-based program for your learners." : "Your organization has not published a learning program yet."} /> : (
        <div className="space-y-4">
          {(programs ?? []).map((program: any) => {
            const programModules = moduleRows.filter((module) => module.program_id === program.id);
            const programEnrollments = visibleEnrollments.filter((enrollment) => enrollment.program_id === program.id);
            return (
              <section key={program.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div><div className="flex items-center gap-2"><h2 className="font-display text-xl font-semibold text-ink">{program.name}</h2><span className="rounded-full bg-indigo-soft px-2 py-1 text-[11px] font-semibold uppercase text-indigo">{program.program_type === "tvet" ? "TVET" : "Workplace"}</span></div><p className="text-sm text-ink-muted mt-1">{program.description || "Competency-based learning pathway"} · {program.duration_weeks} weeks · pass mark {program.pass_score}%</p></div>
                  <div className="text-sm font-semibold text-ink">{programModules.length} modules</div>
                </div>
                <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div><h3 className="section-label">Curriculum</h3>{programModules.length === 0 ? <p className="text-sm text-ink-muted">No modules defined yet.</p> : <ol className="space-y-2">{programModules.map((module) => <li key={module.id} className="rounded-lg border border-border p-3"><div className="text-xs font-semibold text-indigo">Unit {module.sequence}</div><div className="text-sm font-semibold text-ink">{module.title}</div>{module.description && <div className="text-xs text-ink-muted mt-1">{module.description}</div>}</li>)}</ol>}</div>
                  <div><h3 className="section-label">{profile.role === "apprentice" ? "My enrolment" : profile.role === "trainer" ? "Assigned learners" : "Enrolments"}</h3>{programEnrollments.length === 0 ? <p className="text-sm text-ink-muted">No active enrolments for this view.</p> : <div className="space-y-2">{programEnrollments.map((enrollment) => <div key={enrollment.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3"><div><div className="text-sm font-semibold text-ink">{profile.role === "apprentice" ? "Active enrolment" : enrollment.apprentice?.full_name}</div><div className="text-xs text-ink-muted">Trainer: {enrollment.trainer?.full_name || "Not assigned"}{enrollment.institution_student_id ? ` · Student ID: ${enrollment.institution_student_id}` : ""}</div></div><span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">Active</span></div>)}</div>}</div>
                </div>
                {canManage && <div className="mt-5 border-t border-border pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4"><form action={createTrainingModule} className="flex flex-wrap items-end gap-2"><input type="hidden" name="program_id" value={program.id} /><div className="flex-1 min-w-[150px]"><label className="field-label">Add module</label><input name="title" required placeholder="e.g. Take body measurements" className="field-input" /></div><div className="w-20"><label className="field-label">Unit</label><input name="sequence" type="number" min="1" required defaultValue={programModules.length + 1} className="field-input" /></div><SubmitButton>Add</SubmitButton></form><form action={enrollApprentice} className="flex flex-wrap items-end gap-2"><input type="hidden" name="program_id" value={program.id} /><div className="flex-1 min-w-[150px]"><label className="field-label">Enrol learner</label><select name="apprentice_id" required className="field-input"><option value="">Select apprentice</option>{(apprentices ?? []).map((apprentice: any) => <option key={apprentice.id} value={apprentice.id}>{apprentice.full_name}</option>)}</select></div><div className="flex-1 min-w-[140px]"><label className="field-label">Trainer</label><select name="trainer_id" className="field-input"><option value="">Unassigned</option>{(trainers ?? []).map((trainer: any) => <option key={trainer.id} value={trainer.id}>{trainer.full_name}</option>)}</select></div><SubmitButton>Enrol</SubmitButton></form></div>}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}