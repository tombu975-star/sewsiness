import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { createQuiz } from "./actions";

export default async function QuizzesPage() {
  const { user, profile } = await requirePageRegistryFeature(
    ["owner", "manager", "trainer", "apprentice"],
    "apprentices"
  );
  const supabase = createClient();
  const canManage = profile.role === "owner" || profile.role === "manager" || profile.role === "trainer";

  const [{ data: quizzes }, { data: programs }, { data: myAttempts }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, description, pass_score, time_limit_minutes, is_active, program:program_id(name), quiz_questions(id)")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    canManage
      ? supabase.from("training_programs").select("id, name").eq("organization_id", profile.organization_id).eq("is_active", true)
      : Promise.resolve({ data: [] as any[] }),
    profile.role === "apprentice"
      ? supabase.from("quiz_attempts").select("quiz_id, score, max_score, passed, submitted_at").eq("apprentice_id", user.id).order("submitted_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const attemptsByQuiz = new Map<string, any[]>();
  for (const a of myAttempts ?? []) {
    if (!attemptsByQuiz.has(a.quiz_id)) attemptsByQuiz.set(a.quiz_id, []);
    attemptsByQuiz.get(a.quiz_id)!.push(a);
  }

  return (
    <div>
      <PageHead title={profile.role === "apprentice" ? "My Quizzes" : "Quizzes"} subtitle="Auto-scored assessments for your training programs." crumb="Learning" />

      {canManage && (
        <form action={createQuiz} className="card p-5 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="field-label">Quiz title</label>
            <input name="title" required placeholder="e.g. Fabric care fundamentals" className="field-input" />
          </div>
          <div>
            <label className="field-label">Linked program (optional)</label>
            <select name="program_id" className="field-input">
              <option value="">None</option>
              {(programs ?? []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Pass score %</label>
            <input name="pass_score" type="number" min="0" max="100" required defaultValue="70" className="field-input" />
          </div>
          <div>
            <label className="field-label">Time limit (min, optional)</label>
            <input name="time_limit_minutes" type="number" min="1" placeholder="No limit" className="field-input" />
          </div>
          <SubmitButton>Create quiz</SubmitButton>
          <div className="md:col-span-5">
            <label className="field-label">Description (optional)</label>
            <input name="description" placeholder="What does this quiz cover?" className="field-input" />
          </div>
        </form>
      )}

      {(quizzes ?? []).length === 0 ? (
        <EmptyState icon="✓" title="No quizzes yet." description={canManage ? "Create a quiz and add multiple-choice questions to it." : "Your trainer hasn't published a quiz yet."} />
      ) : (
        <div className="space-y-2">
          {(quizzes ?? []).map((q: any) => {
            const attempts = attemptsByQuiz.get(q.id) ?? [];
            const bestPass = attempts.some((a) => a.passed);
            return (
              <Link key={q.id} href={`/quizzes/${q.id}`} className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink">{q.title}</span>
                    {q.program?.name && <span className="rounded-full bg-indigo-soft px-2 py-0.5 text-[11px] font-semibold text-indigo">{q.program.name}</span>}
                  </div>
                  <div className="text-xs text-ink-muted mt-1">
                    {(q.quiz_questions ?? []).length} questions · pass mark {q.pass_score}%
                    {q.time_limit_minutes ? ` · ${q.time_limit_minutes} min` : ""}
                  </div>
                </div>
                {profile.role === "apprentice" && attempts.length > 0 && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bestPass ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {bestPass ? "Passed" : `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
