"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

export async function assignTask(formData: FormData) {
  const { profile, user } = await requireRole(["owner", "manager", "trainer"]);
  const admin = createAdminClient();

  const apprentice_id = String(formData.get("apprentice_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
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

  const { error } = await admin.from("training_tasks").insert({
    apprentice_id,
    organization_id: profile?.organization_id,
    title,
    due_date: formData.get("due_date") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/training-plans");
}

export async function submitTask(formData: FormData) {
  const { user, profile } = await requireRole(["apprentice"]);
  const taskId = String(formData.get("task_id") ?? "");
  const submissionText = String(formData.get("submission_text") ?? "").trim();
  if (!taskId || !submissionText) throw new Error("Add a short description of the work you completed.");

  const admin = createAdminClient();
  const { data: task } = await admin.from("training_tasks").select("apprentice_id, organization_id, status").eq("id", taskId).single();
  if (!task || task.apprentice_id !== user.id || task.organization_id !== profile.organization_id) throw new Error("Task not found.");
  if (task.status === "Approved") throw new Error("This task has already been approved.");

  const { error } = await admin.from("training_tasks").update({
    status: "Submitted",
    submission_text: submissionText,
    submitted_at: new Date().toISOString(),
  }).eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath("/training-plans");
  revalidatePath("/dashboard");
}

export async function reviewTask(formData: FormData) {
  const { user, profile } = await requireRole(["owner", "manager", "trainer"]);
  const taskId = String(formData.get("task_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  const score = Number(formData.get("score") ?? 0);
  if (!taskId || !["Approved", "Needs Changes"].includes(decision)) throw new Error("Choose an assessment result.");
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error("Score must be between 0 and 100.");

  const admin = createAdminClient();
  const { data: task } = await admin
    .from("training_tasks")
    .select("apprentice_id, organization_id, status, max_score")
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

  if (decision === "Approved") await completeIfAllTasksApproved(admin, task.apprentice_id, profile.organization_id, user.id);
  revalidatePath("/training-plans");
  revalidatePath(`/apprentices/${task.apprentice_id}`);
  revalidatePath("/dashboard");
}

async function completeIfAllTasksApproved(admin: ReturnType<typeof createAdminClient>, apprenticeId: string, organizationId: string | null, actorId: string) {
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
