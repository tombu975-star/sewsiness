"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoleRegistryFeature } from "@/lib/auth/require-role";

export async function createSkill(formData: FormData) {
  const { profile } = await requireRoleRegistryFeature(["owner", "manager"], "apprentices");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) throw new Error("Skill name is required.");

  const admin = createAdminClient();
  const { error } = await admin.from("skills").insert({
    organization_id: profile.organization_id,
    name,
    category: category || null,
    description: description || null,
  });
  if (error) throw new Error(error.code === "23505" ? "A skill with this name already exists." : error.message);
  revalidatePath("/skills-matrix");
}

export async function setSkillLevel(formData: FormData) {
  const { user, profile } = await requireRoleRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const apprenticeId = String(formData.get("apprentice_id") ?? "");
  const skillId = String(formData.get("skill_id") ?? "");
  const level = Number(formData.get("level") ?? -1);
  if (!apprenticeId || !skillId || !Number.isInteger(level) || level < 0 || level > 5) {
    throw new Error("A valid apprentice, skill and level (0–5) are required.");
  }

  const admin = createAdminClient();
  const [{ data: apprentice }, { data: skill }] = await Promise.all([
    admin.from("profiles").select("id").eq("id", apprenticeId).eq("organization_id", profile.organization_id).eq("role", "apprentice").single(),
    admin.from("skills").select("id").eq("id", skillId).eq("organization_id", profile.organization_id).single(),
  ]);
  if (!apprentice || !skill) throw new Error("Apprentice or skill not found.");

  const { error } = await admin
    .from("apprentice_skill_levels")
    .upsert(
      {
        organization_id: profile.organization_id,
        apprentice_id: apprenticeId,
        skill_id: skillId,
        level,
        assessed_by: user.id,
        assessed_at: new Date().toISOString(),
      },
      { onConflict: "apprentice_id,skill_id" }
    );
  if (error) throw new Error(error.message);
  revalidatePath("/skills-matrix");
}
