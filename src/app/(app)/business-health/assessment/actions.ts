"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DIMENSIONS } from "@/lib/onboarding/sections";
import { scoreAllDimensions, weightedHealthScore, healthBand, recommendations, completionPercent, type Answers } from "@/lib/onboarding/scoring";
import { assessmentAnswersSchema } from "@/lib/onboarding/validation";
import { isFrameworkSignal, type ActionState } from "@/lib/action-state";

async function requireOwnerOrManager() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id || !["owner", "manager"].includes(profile.role)) {
    throw new Error("Only Owner or Manager can update the Business Health Assessment.");
  }
  return { supabase, user, organizationId: profile.organization_id as string };
}

// Merges newly-submitted answers for one dimension into whatever draft
// already exists, so navigating between tabs never loses earlier answers.
function mergeAnswers(existing: Answers, dimensionKey: string, dimensionAnswers: Record<string, string>): Answers {
  return { ...existing, [dimensionKey]: { ...(existing[dimensionKey] ?? {}), ...dimensionAnswers } };
}

// Saves one dimension's answers to the org's open draft (creating it if
// none exists yet) and recomputes live scores — called on every tab
// change so progress is never lost, and the header score updates as the
// owner works through the form.
export async function saveAssessmentSection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user, organizationId } = await requireOwnerOrManager();

    const dimensionKey = String(formData.get("dimension_key") ?? "");
    const dimension = DIMENSIONS.find((d) => d.key === dimensionKey);
    if (!dimension) return { error: "Unknown assessment section." };

    const dimensionAnswers: Record<string, string> = {};
    for (const q of dimension.questions) {
      const val = formData.get(`q_${q.key}`);
      if (typeof val === "string" && val) dimensionAnswers[q.key] = val;
    }

    const { data: draft } = await supabase
      .from("onboarding_assessments")
      .select("id, answers")
      .eq("organization_id", organizationId)
      .eq("status", "draft")
      .maybeSingle();

    const mergedAnswers = mergeAnswers((draft?.answers as Answers) ?? {}, dimensionKey, dimensionAnswers);
    const parsed = assessmentAnswersSchema.safeParse(mergedAnswers);
    if (!parsed.success) return { error: "Couldn't save those answers — please try again." };

    const dimensionScores = scoreAllDimensions(mergedAnswers);
    const overall = weightedHealthScore(dimensionScores);
    const band = healthBand(overall);

    if (draft?.id) {
      const { error } = await supabase
        .from("onboarding_assessments")
        .update({
          answers: mergedAnswers,
          dimension_scores: dimensionScores,
          overall_score: overall,
          health_band: band.label,
          recommendations: recommendations(dimensionScores),
        })
        .eq("id", draft.id);
      if (error) return { error: error.message };
    } else {
      const { data: latest } = await supabase
        .from("onboarding_assessments")
        .select("version")
        .eq("organization_id", organizationId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { error } = await supabase.from("onboarding_assessments").insert({
        organization_id: organizationId,
        status: "draft",
        version: (latest?.version ?? 0) + 1,
        answers: mergedAnswers,
        dimension_scores: dimensionScores,
        overall_score: overall,
        health_band: band.label,
        recommendations: recommendations(dimensionScores),
        submitted_by: user.id,
      });
      if (error) return { error: error.message };
    }

    revalidatePath("/business-health/assessment");
    revalidatePath("/business-health");
    return {};
  } catch (err) {
    if (isFrameworkSignal(err)) throw err;
    return { error: err instanceof Error ? err.message : "Couldn't save that section." };
  }
}

// Finalises the current draft: locks in the score, marks it `submitted`,
// and logs it — mirrors the audit-trail pattern used across the app
// (see src/app/signup/actions.ts's `business_signup_submitted` entry).
export async function submitAssessment(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user, organizationId } = await requireOwnerOrManager();

    const { data: draft } = await supabase
      .from("onboarding_assessments")
      .select("id, answers, version")
      .eq("organization_id", organizationId)
      .eq("status", "draft")
      .maybeSingle();
    if (!draft) return { error: "Nothing to submit yet — answer at least one section first." };

    const complete = completionPercent((draft.answers as Answers) ?? {});
    if (complete < 100) {
      return { error: `Assessment is ${complete}% complete. Answer every question before submitting.` };
    }

    const { error } = await supabase
      .from("onboarding_assessments")
      .update({ status: "submitted", submitted_at: new Date().toISOString(), submitted_by: user.id })
      .eq("id", draft.id);
    if (error) return { error: error.message };

    await supabase.from("audit_logs").insert({
      organization_id: organizationId,
      actor_id: user.id,
      action: "business_health_assessment_submitted",
      entity: "onboarding_assessments",
      entity_id: draft.id,
    });

    revalidatePath("/business-health/assessment");
    revalidatePath("/business-health");
    return {};
  } catch (err) {
    if (isFrameworkSignal(err)) throw err;
    return { error: err instanceof Error ? err.message : "Couldn't submit the assessment." };
  }
}

// Starts a fresh version after a submitted assessment — e.g. a quarterly
// re-check. The prior submitted row is left untouched (history preserved).
export async function startNewAssessmentVersion(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user, organizationId } = await requireOwnerOrManager();

    const { data: latest } = await supabase
      .from("onboarding_assessments")
      .select("version")
      .eq("organization_id", organizationId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("onboarding_assessments").insert({
      organization_id: organizationId,
      status: "draft",
      version: (latest?.version ?? 0) + 1,
      submitted_by: user.id,
    });
    if (error) return { error: error.message };

    revalidatePath("/business-health/assessment");
    return {};
  } catch (err) {
    if (isFrameworkSignal(err)) throw err;
    return { error: err instanceof Error ? err.message : "Couldn't start a new assessment." };
  }
}
