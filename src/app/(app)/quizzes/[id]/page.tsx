import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { SubmitButton } from "@/components/SubmitButton";
import { addQuestion, startQuizAttempt } from "../actions";

export default async function QuizDetailPage({ params }: { params: { id: string } }) {
  const { user, profile } = await requirePageRegistryFeature(
    ["owner", "manager", "trainer", "apprentice"],
    "apprentices"
  );
  const supabase = createClient();
  const canManage = profile.role === "owner" || profile.role === "manager" || profile.role === "trainer";

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, description, pass_score, time_limit_minutes")
    .eq("id", params.id)
    .eq("organization_id", profile.organization_id)
    .single();
  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, prompt, points, sequence, quiz_options(id, label, is_correct, sequence)")
    .eq("quiz_id", params.id)
    .order("sequence", { ascending: true });

  if (profile.role === "apprentice") {
    const { data: myAttempts } = await supabase
      .from("quiz_attempts")
      .select("id, attempt_number, score, max_score, passed, submitted_at")
      .eq("quiz_id", params.id)
      .eq("apprentice_id", user.id)
      .order("attempt_number", { ascending: false });

    const inProgress = (myAttempts ?? []).find((a) => !a.submitted_at);

    return (
      <div>
        <PageHead title={quiz.title} subtitle={quiz.description ?? `${(questions ?? []).length} questions · pass mark ${quiz.pass_score}%`} crumb="My Quizzes" />

        {inProgress ? (
          <a href={`/quizzes/${quiz.id}/take?attempt=${inProgress.id}`} className="inline-flex items-center rounded-lg bg-indigo text-white text-sm font-semibold px-4 py-2.5 hover:brightness-110">
            Continue attempt
          </a>
        ) : (
          <form action={startQuizAttempt}>
            <input type="hidden" name="quiz_id" value={quiz.id} />
            <SubmitButton>Start quiz</SubmitButton>
          </form>
        )}

        {(myAttempts ?? []).filter((a) => a.submitted_at).length > 0 && (
          <div className="mt-6">
            <h3 className="section-label mb-2">Your attempts</h3>
            <div className="space-y-2">
              {(myAttempts ?? [])
                .filter((a) => a.submitted_at)
                .map((a) => (
                  <div key={a.id} className="card p-4 flex items-center justify-between">
                    <span className="text-sm text-ink-muted">Attempt {a.attempt_number}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.passed ? "bg-success/10 text-success" : "bg-danger-soft text-danger"}`}>
                      {a.score}/{a.max_score} — {a.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHead title={quiz.title} subtitle={quiz.description ?? `Pass mark ${quiz.pass_score}%${quiz.time_limit_minutes ? ` · ${quiz.time_limit_minutes} min` : ""}`} crumb="Quizzes" />

      {canManage && (
        <form action={addQuestion} className="card p-5 mb-6 space-y-3">
          <input type="hidden" name="quiz_id" value={quiz.id} />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-4">
              <label className="field-label">Question</label>
              <input name="prompt" required placeholder="e.g. What temperature should you press cotton at?" className="field-input" />
            </div>
            <div>
              <label className="field-label">Points</label>
              <input name="points" type="number" min="1" step="1" required defaultValue="1" className="field-input" />
            </div>
            <div>
              <label className="field-label">Order</label>
              <input name="sequence" type="number" min="1" required defaultValue={(questions ?? []).length + 1} className="field-input" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="field-label">Answer options — mark the correct one</label>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct_index" value={i} required className="w-4 h-4 accent-gold flex-shrink-0" />
                <input name="option_label" placeholder={`Option ${i + 1}${i < 2 ? " (required)" : " (optional)"}`} required={i < 2} className="field-input" />
              </div>
            ))}
          </div>
          <SubmitButton>Add question</SubmitButton>
        </form>
      )}

      {(questions ?? []).length === 0 ? (
        <p className="text-sm text-ink-muted">No questions yet — add the first one above.</p>
      ) : (
        <ol className="space-y-3">
          {(questions ?? []).map((q: any, idx: number) => (
            <li key={q.id} className="card p-4">
              <div className="text-xs font-semibold text-indigo mb-1">Question {idx + 1} · {q.points} pt{q.points === 1 ? "" : "s"}</div>
              <div className="font-semibold text-ink text-sm mb-2">{q.prompt}</div>
              <ul className="space-y-1">
                {(q.quiz_options ?? []).sort((a: any, b: any) => a.sequence - b.sequence).map((o: any) => (
                  <li key={o.id} className={`text-xs rounded-lg px-3 py-1.5 ${o.is_correct ? "bg-success/10 text-success font-semibold" : "bg-sunken text-ink-muted"}`}>
                    {o.is_correct ? "✓ " : ""}{o.label}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
