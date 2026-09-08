import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";

export default async function QuizResultPage({
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
    .select("id, apprentice_id, quiz_id, score, max_score, passed, submitted_at")
    .eq("id", attemptId)
    .eq("organization_id", profile.organization_id)
    .single();
  if (!attempt || attempt.apprentice_id !== user.id || attempt.quiz_id !== params.id || !attempt.submitted_at) notFound();

  const { data: quiz } = await supabase.from("quizzes").select("title, pass_score").eq("id", params.id).single();
  const percentage = attempt.max_score ? Math.round(((attempt.score ?? 0) / attempt.max_score) * 100) : 0;

  return (
    <div>
      <PageHead title="Quiz result" subtitle={quiz?.title} crumb="My Quizzes" />

      <div className={`card p-8 text-center ${attempt.passed ? "border-success/30" : "border-danger/30"}`}>
        <div className={`font-display text-4xl font-bold ${attempt.passed ? "text-success" : "text-danger"}`}>{percentage}%</div>
        <div className="text-sm text-ink-muted mt-1">
          {attempt.score}/{attempt.max_score} points · pass mark {quiz?.pass_score}%
        </div>
        <div className={`mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${attempt.passed ? "bg-success/10 text-success" : "bg-danger-soft text-danger"}`}>
          {attempt.passed ? "Passed" : "Not passed"}
        </div>
      </div>

      <Link href={`/quizzes/${params.id}`} className="inline-flex items-center mt-6 text-sm font-semibold text-indigo hover:underline">
        Back to quiz
      </Link>
    </div>
  );
}
