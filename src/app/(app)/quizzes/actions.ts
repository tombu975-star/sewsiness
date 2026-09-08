"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoleRegistryFeature } from "@/lib/auth/require-role";

export async function createQuiz(formData: FormData) {
  const { user, profile } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const programId = String(formData.get("program_id") ?? "") || null;
  const passScore = Number(formData.get("pass_score") ?? 70);
  const timeLimitRaw = String(formData.get("time_limit_minutes") ?? "");
  const timeLimit = timeLimitRaw ? Number(timeLimitRaw) : null;

  if (!title) throw new Error("Quiz title is required.");
  if (!Number.isFinite(passScore) || passScore < 0 || passScore > 100) throw new Error("Pass score must be between 0 and 100.");
  if (timeLimit !== null && (!Number.isInteger(timeLimit) || timeLimit < 1)) throw new Error("Time limit must be a positive whole number of minutes.");

  const admin = createAdminClient();
  if (programId) {
    const { data: program } = await admin.from("training_programs").select("id").eq("id", programId).eq("organization_id", profile.organization_id).single();
    if (!program) throw new Error("Program not found.");
  }

  const { data: quiz, error } = await admin
    .from("quizzes")
    .insert({
      organization_id: profile.organization_id,
      program_id: programId,
      title,
      description: description || null,
      pass_score: passScore,
      time_limit_minutes: timeLimit,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/quizzes");
  redirect(`/quizzes/${quiz.id}`);
}

export async function addQuestion(formData: FormData) {
  const { profile } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const quizId = String(formData.get("quiz_id") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const points = Number(formData.get("points") ?? 1);
  const sequence = Number(formData.get("sequence") ?? 1);
  const optionLabels = formData.getAll("option_label").map((v) => String(v).trim());
  const correctIndex = Number(formData.get("correct_index") ?? -1);

  if (!quizId || !prompt) throw new Error("Question prompt is required.");
  if (!Number.isFinite(points) || points <= 0) throw new Error("Points must be a positive number.");
  const filledOptions = optionLabels.filter(Boolean);
  if (filledOptions.length < 2) throw new Error("At least two answer options are required.");
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= optionLabels.length || !optionLabels[correctIndex]) {
    throw new Error("Select which option is correct.");
  }

  const admin = createAdminClient();
  const { data: quiz } = await admin.from("quizzes").select("id").eq("id", quizId).eq("organization_id", profile.organization_id).single();
  if (!quiz) throw new Error("Quiz not found.");

  const { data: question, error } = await admin
    .from("quiz_questions")
    .insert({ quiz_id: quizId, organization_id: profile.organization_id, prompt, points, sequence })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const optionRows = optionLabels
    .map((label, i) => ({ label, i }))
    .filter((o) => o.label)
    .map((o) => ({
      question_id: question.id,
      organization_id: profile.organization_id,
      label: o.label,
      is_correct: o.i === correctIndex,
      sequence: o.i + 1,
    }));
  const { error: optionsError } = await admin.from("quiz_options").insert(optionRows);
  if (optionsError) throw new Error(optionsError.message);

  revalidatePath(`/quizzes/${quizId}`);
}

export async function startQuizAttempt(formData: FormData) {
  const { user, profile } = await requireRoleRegistryFeature(["apprentice"], "apprentices");
  const quizId = String(formData.get("quiz_id") ?? "");
  if (!quizId) throw new Error("Quiz is required.");

  const admin = createAdminClient();
  const { data: quiz } = await admin.from("quizzes").select("id, is_active").eq("id", quizId).eq("organization_id", profile.organization_id).single();
  if (!quiz || !quiz.is_active) throw new Error("This quiz is not available.");

  const { count } = await admin
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId)
    .eq("apprentice_id", user.id);

  const { data: attempt, error } = await admin
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      organization_id: profile.organization_id,
      apprentice_id: user.id,
      attempt_number: (count ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  redirect(`/quizzes/${quizId}/take?attempt=${attempt.id}`);
}

export async function submitQuizAttempt(formData: FormData) {
  const { user, profile } = await requireRoleRegistryFeature(["apprentice"], "apprentices");
  const attemptId = String(formData.get("attempt_id") ?? "");
  const quizId = String(formData.get("quiz_id") ?? "");
  if (!attemptId || !quizId) throw new Error("Attempt is required.");

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("quiz_attempts")
    .select("id, apprentice_id, submitted_at")
    .eq("id", attemptId)
    .eq("organization_id", profile.organization_id)
    .single();
  if (!attempt || attempt.apprentice_id !== user.id) throw new Error("Attempt not found.");
  if (attempt.submitted_at) throw new Error("This attempt has already been submitted.");

  const [{ data: quiz }, { data: questions }] = await Promise.all([
    admin.from("quizzes").select("pass_score").eq("id", quizId).single(),
    admin.from("quiz_questions").select("id, points, quiz_options(id, is_correct)").eq("quiz_id", quizId),
  ]);
  if (!quiz || !questions) throw new Error("Quiz not found.");

  let score = 0;
  let maxScore = 0;
  const answerRows: { attempt_id: string; organization_id: string; question_id: string; selected_option_id: string | null; is_correct: boolean | null }[] = [];

  for (const q of questions as any[]) {
    maxScore += q.points;
    const selectedOptionId = String(formData.get(`question_${q.id}`) ?? "") || null;
    const selectedOption = (q.quiz_options ?? []).find((o: any) => o.id === selectedOptionId);
    const isCorrect = selectedOption ? Boolean(selectedOption.is_correct) : null;
    if (isCorrect) score += q.points;
    answerRows.push({
      attempt_id: attemptId,
      organization_id: profile.organization_id,
      question_id: q.id,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
    });
  }

  const { error: answersError } = await admin.from("quiz_attempt_answers").insert(answerRows);
  if (answersError) throw new Error(answersError.message);

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const passed = percentage >= quiz.pass_score;

  const { error } = await admin
    .from("quiz_attempts")
    .update({ submitted_at: new Date().toISOString(), score, max_score: maxScore, passed })
    .eq("id", attemptId);
  if (error) throw new Error(error.message);

  revalidatePath(`/quizzes/${quizId}`);
  redirect(`/quizzes/${quizId}/result?attempt=${attemptId}`);
}
