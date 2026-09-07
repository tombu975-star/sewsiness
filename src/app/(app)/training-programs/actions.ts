"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

export async function createTrainingProgram(formData: FormData) {
  const { user, profile } = await requireRole(["owner", "manager"]);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const programType = String(formData.get("program_type") ?? "workplace");
  const durationWeeks = Number(formData.get("duration_weeks") ?? 0);
  const passScore = Number(formData.get("pass_score") ?? 70);

  if (!name || !["workplace", "tvet"].includes(programType)) throw new Error("Program name and type are required.");
  if (!Number.isInteger(durationWeeks) || durationWeeks < 1) throw new Error("Duration must be at least one week.");
  if (!Number.isFinite(passScore) || passScore < 0 || passScore > 100) throw new Error("Pass score must be between 0 and 100.");

  const admin = createAdminClient();
  const { error } = await admin.from("training_programs").insert({
    organization_id: profile.organization_id,
    name,
    description: description || null,
    program_type: programType,
    duration_weeks: durationWeeks,
    pass_score: passScore,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/training-programs");
}

export async function createTrainingModule(formData: FormData) {
  const { profile } = await requireRole(["owner", "manager"]);
  const programId = String(formData.get("program_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sequence = Number(formData.get("sequence") ?? 0);
  if (!programId || !title || !Number.isInteger(sequence) || sequence < 1) throw new Error("Module title and sequence are required.");

  const admin = createAdminClient();
  const { data: program } = await admin.from("training_programs").select("id").eq("id", programId).eq("organization_id", profile.organization_id).single();
  if (!program) throw new Error("Program not found.");
  const { error } = await admin.from("training_modules").insert({
    program_id: programId,
    organization_id: profile.organization_id,
    title,
    description: description || null,
    sequence,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/training-programs");
}

export async function enrollApprentice(formData: FormData) {
  const { profile } = await requireRole(["owner", "manager"]);
  const programId = String(formData.get("program_id") ?? "");
  const apprenticeId = String(formData.get("apprentice_id") ?? "");
  const trainerId = String(formData.get("trainer_id") ?? "") || null;
  const institutionName = String(formData.get("institution_name") ?? "").trim();
  const institutionStudentId = String(formData.get("institution_student_id") ?? "").trim();
  if (!programId || !apprenticeId) throw new Error("Program and apprentice are required.");

  const admin = createAdminClient();
  const [{ data: program }, { data: apprentice }] = await Promise.all([
    admin.from("training_programs").select("id").eq("id", programId).eq("organization_id", profile.organization_id).single(),
    admin.from("profiles").select("id").eq("id", apprenticeId).eq("organization_id", profile.organization_id).eq("role", "apprentice").single(),
  ]);
  if (!program || !apprentice) throw new Error("Program or apprentice not found.");
  const { error } = await admin.from("program_enrollments").insert({
    organization_id: profile.organization_id,
    program_id: programId,
    apprentice_id: apprenticeId,
    trainer_id: trainerId,
    institution_name: institutionName || null,
    institution_student_id: institutionStudentId || null,
  });
  if (error) throw new Error(error.code === "23505" ? "This apprentice is already active in this program." : error.message);
  revalidatePath("/training-programs");
  revalidatePath("/dashboard");
}