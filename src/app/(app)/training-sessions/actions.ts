"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoleRegistryFeature } from "@/lib/auth/require-role";

export async function createTrainingSession(formData: FormData) {
  const { user, profile } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const programId = String(formData.get("program_id") ?? "") || null;
  const capacityRaw = String(formData.get("capacity") ?? "");
  const capacity = capacityRaw ? Number(capacityRaw) : null;
  const apprenticeIds = formData.getAll("apprentice_ids").map(String).filter(Boolean);

  if (!title || !startsAt || !endsAt) throw new Error("Title, start time and end time are required.");
  const starts = new Date(startsAt);
  const ends = new Date(endsAt);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime()) || ends <= starts) {
    throw new Error("End time must be after the start time.");
  }
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    throw new Error("Capacity must be a positive whole number.");
  }

  const admin = createAdminClient();

  if (programId) {
    const { data: program } = await admin
      .from("training_programs")
      .select("id")
      .eq("id", programId)
      .eq("organization_id", profile.organization_id)
      .single();
    if (!program) throw new Error("Program not found.");
  }

  // A Trainer scheduling a session is automatically the trainer for it;
  // Owner/Manager may leave it unassigned (assigned later from the
  // session detail page) since they might be booking on a Trainer's
  // behalf without deciding who runs it yet.
  const trainerId = profile.role === "trainer" ? user.id : null;

  const { data: session, error } = await admin
    .from("training_sessions")
    .insert({
      organization_id: profile.organization_id,
      program_id: programId,
      title,
      description: description || null,
      location: location || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      capacity,
      trainer_id: trainerId,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (apprenticeIds.length > 0) {
    const { data: validApprentices } = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("role", "apprentice")
      .in("id", apprenticeIds);
    const validIds = new Set((validApprentices ?? []).map((a) => a.id as string));
    const rows = apprenticeIds
      .filter((id) => validIds.has(id))
      .map((apprenticeId) => ({
        session_id: session.id,
        organization_id: profile.organization_id,
        apprentice_id: apprenticeId,
      }));
    if (rows.length > 0) {
      const { error: rosterError } = await admin.from("session_attendance").insert(rows);
      if (rosterError) throw new Error(rosterError.message);
    }
  }

  revalidatePath("/training-sessions");
}

export async function markAttendance(formData: FormData) {
  const { user, profile } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const attendanceId = String(formData.get("attendance_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const validStatuses = ["invited", "present", "absent", "late", "excused"];
  if (!attendanceId || !validStatuses.includes(status)) throw new Error("A valid attendance status is required.");

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("session_attendance")
    .select("id")
    .eq("id", attendanceId)
    .eq("organization_id", profile.organization_id)
    .single();
  if (!row) throw new Error("Attendance record not found.");

  const { error } = await admin
    .from("session_attendance")
    .update({
      status,
      checked_in_at: ["present", "late"].includes(status) ? new Date().toISOString() : null,
      checked_in_by: user.id,
    })
    .eq("id", attendanceId);
  if (error) throw new Error(error.message);

  revalidatePath(`/training-sessions/${sessionId}`);
  revalidatePath("/training-sessions");
}

export async function updateSessionStatus(formData: FormData) {
  const { profile } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const sessionId = String(formData.get("session_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!sessionId || !["scheduled", "completed", "cancelled"].includes(status)) {
    throw new Error("A valid session status is required.");
  }

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("training_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("organization_id", profile.organization_id)
    .single();
  if (!session) throw new Error("Session not found.");

  const { error } = await admin.from("training_sessions").update({ status }).eq("id", sessionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/training-sessions/${sessionId}`);
  revalidatePath("/training-sessions");
}
