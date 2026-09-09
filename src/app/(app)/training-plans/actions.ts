"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoleRegistryFeature } from "@/lib/auth/require-role";

export async function assignTask(formData: FormData) {
  const { profile, user } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const admin = createAdminClient();

  const apprentice_id = String(formData.get("apprentice_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const module_id = String(formData.get("module_id") ?? "") || null;
  const enrollment_id = String(formData.get("enrollment_id") ?? "") || null;
  if (!apprentice_id || !title) throw new Error("Apprentice and task title are required.");

  const { data: apprentice } = await admin
    .from("apprentice_profiles")
    .select("organization_id, trainer_id")
    .eq("profile_id", apprentice_id)
    .single();
  if (!apprentice || apprentice.organization_id !== profile.organization_id) throw new Error("Apprentice not found.");
  if (profile.role === "trainer" && apprentice.trainer_id !== user.id) {
    throw new Error("You can only assign tasks to apprentices assigned to you.");
  }

  if (enrollment_id) {
    const { data: enrollment } = await admin.from("program_enrollments").select("id, apprentice_id, organization_id").eq("id", enrollment_id).single();
    if (!enrollment || enrollment.apprentice_id !== apprentice_id || enrollment.organization_id !== profile.organization_id) throw new Error("Enrollment does not belong to this apprentice.");
  }
  if (module_id) {
    const { data: module } = await admin.from("training_modules").select("id, organization_id").eq("id", module_id).eq("organization_id", profile.organization_id).single();
    if (!module) throw new Error("Training module not found.");
  }

  const { error } = await admin.from("training_tasks").insert({
    apprentice_id,
    organization_id: profile?.organization_id,
    title,
    due_date: formData.get("due_date") || null,
    module_id,
    enrollment_id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/training-plans");
}

export async function updateTaskStatus(taskId: string, status: string) {
  const { user, profile } = await requireRoleRegistryFeature(["apprentice"], "apprentices");
  const allowedStatuses = ["Assigned", "In Progress", "Needs Changes"];
  if (!taskId || !allowedStatuses.includes(status)) throw new Error("Invalid task status.");

  const admin = createAdminClient();
  const { data: task } = await admin
    .from("training_tasks")
    .select("id, apprentice_id, organization_id, status")
    .eq("id", taskId)
    .single();
  if (!task || task.apprentice_id !== user.id || task.organization_id !== profile.organization_id) throw new Error("Task not found.");
  if (["Submitted", "Approved"].includes(task.status)) throw new Error("This task can no longer be updated.");

  const { error } = await admin.from("training_tasks").update({ status }).eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath("/training-plans");
  revalidatePath("/dashboard");
}

export async function submitTask(formData: FormData) {
  const { user, profile } = await requireRoleRegistryFeature(["apprentice"], "apprentices");
  const taskId = String(formData.get("task_id") ?? "");
  const submissionText = String(formData.get("submission_text") ?? "").trim();
  if (!taskId || !submissionText) throw new Error("Add a short description of the work you completed.");

  const admin = createAdminClient();
  const { data: task } = await admin.from("training_tasks").select("apprentice_id, organization_id, status, evidence_path").eq("id", taskId).single();
  if (!task || task.apprentice_id !== user.id || task.organization_id !== profile.organization_id) throw new Error("Task not found.");
  if (task.status === "Approved") throw new Error("This task has already been approved.");

  const evidence = formData.get("evidence");
  let evidencePath: string | null = task.evidence_path;
  let uploadedPath: string | null = null;
  if (evidence instanceof File && evidence.size > 0) {
    const allowedTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const extension = allowedTypes[evidence.type];
    if (!extension) throw new Error("Evidence must be a JPG, PNG, or WebP image.");
    if (evidence.size > 12 * 1024 * 1024) throw new Error("Evidence images must be 12 MB or smaller.");

    uploadedPath = `${profile.organization_id}/${user.id}/${taskId}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from("training-evidence").upload(uploadedPath, evidence, {
      contentType: evidence.type,
      upsert: false,
    });
    if (uploadError) throw new Error(uploadError.message);
    evidencePath = uploadedPath;
  }

  const { error } = await admin.from("training_tasks").update({
    status: "Submitted",
    submission_text: submissionText,
    submitted_at: new Date().toISOString(),
    evidence_path: evidencePath,
  }).eq("id", taskId);
  if (error) {
    if (uploadedPath) await admin.storage.from("training-evidence").remove([uploadedPath]);
    throw new Error(error.message);
  }
  if (uploadedPath && task.evidence_path) await admin.storage.from("training-evidence").remove([task.evidence_path]);
  revalidatePath("/training-plans");
  revalidatePath("/dashboard");
}

export async function reviewTask(formData: FormData) {
  const { user, profile } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const taskId = String(formData.get("task_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  const score = Number(formData.get("score") ?? 0);
  if (!taskId || !["Approved", "Needs Changes"].includes(decision)) throw new Error("Choose an assessment result.");
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error("Score must be between 0 and 100.");

  const admin = createAdminClient();
  const { data: task } = await admin
    .from("training_tasks")
    .select("apprentice_id, organization_id, status, max_score, enrollment_id")
    .eq("id", taskId)
    .single();
  if (!task || task.organization_id !== profile.organization_id) throw new Error("Task not found.");
  if (profile.role === "trainer") {
    const { data: apprentice } = await admin.from("apprentice_profiles").select("trainer_id").eq("profile_id", task.apprentice_id).single();
    if (apprentice?.trainer_id !== user.id) throw new Error("You can only review your assigned apprentices.");
  }
  if (task.status !== "Submitted") throw new Error("Only submitted work can be reviewed.");

  const { error } = await admin.from("training_tasks").update({
    status: decision,
    score,
    feedback: feedback || null,
    evaluated_by: user.id,
    evaluated_at: new Date().toISOString(),
  }).eq("id", taskId);
  if (error) throw new Error(error.message);

  if (decision === "Approved") await completeIfAllTasksApproved(admin, task.apprentice_id, profile.organization_id, user.id, task.enrollment_id);
  revalidatePath("/training-plans");
  revalidatePath(`/apprentices/${task.apprentice_id}`);
  revalidatePath("/dashboard");
}

async function completeIfAllTasksApproved(admin: ReturnType<typeof createAdminClient>, apprenticeId: string, organizationId: string | null, actorId: string, enrollmentId: string | null) {
  if (enrollmentId) {
    const { data: tasks } = await admin.from("training_tasks").select("status, score, max_score").eq("enrollment_id", enrollmentId).eq("organization_id", organizationId);
    if (!tasks?.length || tasks.some((item) => item.status !== "Approved")) return;
    const totalMax = tasks.reduce((sum, item) => sum + Number(item.max_score || 100), 0);
    const totalScore = tasks.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const finalScore = totalMax ? (totalScore / totalMax) * 100 : 0;
    const { data: enrollment } = await admin.from("program_enrollments").select("id, program_id, status, program:program_id(name, pass_score)").eq("id", enrollmentId).eq("apprentice_id", apprenticeId).single();
    if (!enrollment || enrollment.status !== "active") return;
    await admin.from("program_enrollments").update({ status: "completed", completed_at: new Date().toISOString(), final_score: finalScore }).eq("id", enrollmentId);
    const { data: existingCertificate } = await admin.from("certificates").select("id").eq("enrollment_id", enrollmentId).maybeSingle();
    if (!existingCertificate) {
      const passScore = Number((enrollment.program as any)?.pass_score ?? 70);
      const grade = finalScore >= 80 ? "Distinction" : finalScore >= passScore ? "Pass" : "Not Yet Competent";
      if (finalScore >= passScore) {
        const { error: certificateError } = await admin.from("certificates").insert({
          organization_id: organizationId,
          apprentice_id: apprenticeId,
          program_id: enrollment.program_id,
          enrollment_id: enrollmentId,
          certificate_number: `SEW-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          verification_code: randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
          final_score: finalScore,
          grade,
          issued_by: actorId,
        });
        if (certificateError) throw new Error(`Enrollment completed, but certificate issuance failed: ${certificateError.message}`);
      }
    }
    return;
  }

  const { data: tasks } = await admin.from("training_tasks").select("status").eq("apprentice_id", apprenticeId).eq("organization_id", organizationId);
  if (!tasks?.length || tasks.some((task) => task.status !== "Approved")) return;
  const { data: apprentice } = await admin.from("apprentice_profiles").select("completed_at").eq("profile_id", apprenticeId).single();
  if (apprentice?.completed_at) return;

  const certificateNumber = `SEW-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  await admin.from("apprentice_profiles").update({
    completed_at: new Date().toISOString(),
    completed_by: actorId,
    certificate_number: certificateNumber,
  }).eq("profile_id", apprenticeId);
  await admin.from("audit_logs").insert({
    organization_id: organizationId,
    actor_id: actorId,
    action: "apprentice_training_completed",
    entity: "apprentice_profiles",
    entity_id: apprenticeId,
  });
}

// An enrollment can reach status="completed" with every task approved
// but no certificate — completeIfAllTasksApproved() above always marks
// the enrollment completed once tasks clear, but only issues a
// certificate if the final score meets the program's pass_score. Until
// now there was no way back from that state: the apprentice's page
// showed "Completed" with no working download, and nothing let a
// trainer send them back to redo work. This reopens the SAME enrollment
// for a retake — it does not touch training_tasks, so staff decide
// separately (assign new/updated tasks, ask for a resubmission, etc.)
// what "retake" actually looks like for that program.
export async function reopenEnrollmentForRetake(formData: FormData) {
  const { profile, user } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const admin = createAdminClient();

  const enrollment_id = String(formData.get("enrollment_id") ?? "");
  if (!enrollment_id) throw new Error("Missing enrollment.");

  const { data: enrollment } = await admin
    .from("program_enrollments")
    .select("id, apprentice_id, organization_id, status")
    .eq("id", enrollment_id)
    .single();
  if (!enrollment || enrollment.organization_id !== profile.organization_id) throw new Error("Enrollment not found.");
  if (enrollment.status !== "completed") throw new Error("Only a completed enrollment can be reopened for a retake.");

  // Refuse if a valid certificate already exists for this enrollment —
  // reopening would let someone who genuinely passed get sent back to
  // redo work they already completed successfully. Revoking a
  // certificate is a separate, more deliberate action than this button.
  const { data: existingCertificate } = await admin
    .from("certificates")
    .select("id")
    .eq("enrollment_id", enrollment_id)
    .is("revoked_at", null)
    .maybeSingle();
  if (existingCertificate) {
    throw new Error("This enrollment already has an issued certificate — it can't be reopened this way. Revoke the certificate first if that's really what you want.");
  }

  await admin
    .from("program_enrollments")
    .update({ status: "active", completed_at: null, final_score: null })
    .eq("id", enrollment_id);

  await admin.from("audit_logs").insert({
    organization_id: profile.organization_id,
    actor_id: user.id,
    action: "enrollment_reopened_for_retake",
    entity: "program_enrollments",
    entity_id: enrollment_id,
  });

  revalidatePath(`/apprentices/${enrollment.apprentice_id}`);
  revalidatePath("/training-plans");
  revalidatePath("/training-compliance");
  revalidatePath("/dashboard");
}
