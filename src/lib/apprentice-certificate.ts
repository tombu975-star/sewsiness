import type { createClient } from "@/lib/supabase/server";

// Whether an apprentice has an issuable certificate is now checked in
// three separate places (their own dashboard, the Owner/Manager/Trainer
// detail page, and the download route itself) — each used to
// hand-write its own version of "completed_at is set OR a certificates
// row exists". That's exactly how these three copies drifted apart: the
// structured Training Programs path (completeIfAllTasksApproved in
// training-plans/actions.ts, when a task belongs to a program
// enrollment) inserts a `certificates` row but never touches
// apprentice_profiles.completed_at, while the ad-hoc "Mark Training
// Complete" button (apprentices/actions.ts) only ever sets
// completed_at and never inserts into `certificates`. Any check that
// only looks at one of the two signals misses apprentices completed
// through the other path — apprentices/[id]/page.tsx's isCompleted
// used to do exactly that (completed_at only), so a Trainer could never
// see or open the certificate for someone who'd completed a structured
// program, even though their own dashboard (which already OR'd both
// signals) could. One function, called from all three places, removes
// the chance of that drift recurring.
export interface ApprenticeCertificateStatus {
  ready: boolean;
  completedAt: string | null;
  certificateNumber: string | null;
  trainerName: string | null;
  trainingLevel: string | null;
  specialisation: string | null;
  trainingGoals: string | null;
  startDate: string | null;
  // Present only when a structured Training Program issued a formal
  // `certificates` row (final score, grade, and a verification_code
  // the /verify/[code] page and the PDF's QR code both rely on).
  structured: {
    certificateNumber: string;
    verificationCode: string | null;
    finalScore: number | null;
    grade: string | null;
    issuedAt: string;
    programName: string | null;
    programType: string | null;
  } | null;
  // A program_enrollments row can reach status="completed" without a
  // certificate ever being issued — completeIfAllTasksApproved() in
  // training-plans/actions.ts always marks the enrollment completed
  // once every task is approved, but only inserts a certificates row
  // if the final score clears the program's pass_score. Present only
  // when that's exactly the state this apprentice is stuck in: every
  // task approved, enrollment completed, no passing certificate — so
  // a "Reopen for retake" action has something concrete to act on.
  failedEnrollment: {
    enrollmentId: string;
    finalScore: number | null;
    passScore: number | null;
    programName: string | null;
  } | null;
}

export async function getApprenticeCertificateStatus(
  supabase: ReturnType<typeof createClient>,
  apprenticeId: string
): Promise<ApprenticeCertificateStatus> {
  const [{ data: ap }, { data: cert }, { data: completedEnrollments }] = await Promise.all([
    supabase
      .from("apprentice_profiles")
      .select("training_level, specialisation, training_goals, start_date, completed_at, certificate_number, trainer:trainer_id(full_name)")
      .eq("profile_id", apprenticeId)
      .maybeSingle(),
    supabase
      .from("certificates")
      .select("certificate_number, verification_code, final_score, grade, issued_at, program:program_id(name, program_type)")
      .eq("apprentice_id", apprenticeId)
      .is("revoked_at", null)
      .order("issued_at", { ascending: false })
      .maybeSingle(),
    supabase
      .from("program_enrollments")
      .select("id, final_score, program:program_id(name, pass_score)")
      .eq("apprentice_id", apprenticeId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
  ]);

  const program = (cert as any)?.program ?? null;

  // Only surface the most recent completed-but-uncertified enrollment.
  // If the apprentice has any issued certificate at all (cert, from
  // the query above) they're not in a "failed" state — that governs
  // even if an older completed enrollment without one also exists.
  const mostRecentCompleted = (completedEnrollments ?? [])[0] as any;
  const failedEnrollment =
    !cert && mostRecentCompleted
      ? {
          enrollmentId: mostRecentCompleted.id,
          finalScore: mostRecentCompleted.final_score ?? null,
          passScore: mostRecentCompleted.program?.pass_score ?? null,
          programName: mostRecentCompleted.program?.name ?? null,
        }
      : null;

  return {
    ready: Boolean(cert || ap?.completed_at),
    completedAt: (cert as any)?.issued_at ?? ap?.completed_at ?? null,
    certificateNumber: (cert as any)?.certificate_number ?? ap?.certificate_number ?? null,
    trainerName: (ap as any)?.trainer?.full_name ?? null,
    trainingLevel: ap?.training_level ?? null,
    specialisation: ap?.specialisation ?? null,
    trainingGoals: ap?.training_goals ?? null,
    startDate: ap?.start_date ?? null,
    structured: cert
      ? {
          certificateNumber: (cert as any).certificate_number,
          verificationCode: (cert as any).verification_code ?? null,
          finalScore: (cert as any).final_score ?? null,
          grade: (cert as any).grade ?? null,
          issuedAt: (cert as any).issued_at,
          programName: program?.name ?? null,
          programType: program?.program_type ?? null,
        }
      : null,
    failedEnrollment,
  };
}
