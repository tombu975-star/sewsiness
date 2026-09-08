import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { SubmitButton } from "@/components/SubmitButton";
import { submitQuizAttempt } from "../../actions";

export default async function TakeQuizPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { attempt?: string };
}) {
  const { user, profile } = await requirePageRegistryFeature(["apprentice"], "apprentices");
  const supabase = createClient();
  const attemptId = searchParams.attempt;
  if (!attemptId) redirect(`/quizzes/${params.id}`);

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, apprentice_id, submitted_at, quiz_id")
    .eq("id", attemptId)
    .eq("organization_id", profile.organization_id)
    .single();
  if (!attempt || attempt.apprentice_id !== user.id || attempt.quiz_id !== params.id) notFound();
  if (attempt.submitted_at) redirect(`/quizzes/${params.id}/result?attempt=${attemptId}`);

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, time_limit_minutes")
    .eq("id", params.id)
    .single();
  if (!quiz) notFound();

  // Intentionally NOT selecting is_correct — this is the only guard
  // against an apprentice reading the answer key before submitting
  // (see the migration's note on quiz_options RLS).
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, prompt, sequence, quiz_options(id, label, sequence)")
    .eq("quiz_id", params.id)
    .order("sequence", { ascending: true });

  return (
    <div>
      <PageHead title={quiz.title} subtitle={quiz.time_limit_minutes ? `Time limit: ${quiz.time_limit_minutes} minutes` : "Answer every question, then submit."} crumb="My Quizzes" />

      <form action={submitQuizAttempt} className="space-y-4">
        <input type="hidden" name="attempt_id" value={attempt.id} />
        <input type="hidden" name="quiz_id" value={quiz.id} />

        {(questions ?? []).map((q: any, idx: number) => (
          <div key={q.id} className="card p-4">
            <div className="text-xs font-semibold text-indigo mb-1">Question {idx + 1}</div>
            <div className="font-semibold text-ink text-sm mb-3">{q.prompt}</div>
            <div className="space-y-2">
              {(q.quiz_options ?? []).sort((a: any, b: any) => a.sequence - b.sequence).map((o: any) => (
                <label key={o.id} className="flex items-center gap-2 text-sm text-ink-muted rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-sunken">
                  <input type="radio" name={`question_${q.id}`} value={o.id} required className="w-4 h-4 accent-gold flex-shrink-0" />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        ))}

        <SubmitButton pendingLabel="Submitting…">Submit quiz</SubmitButton>
      </form>
    </div>
  );
}
