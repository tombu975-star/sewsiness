"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

// Feature flags gate functionality across every business on the
// platform — a wrong flip is a platform-wide incident, not a per-org
// one. Logged via the admin client (not the session-bound one) because
// System Admin has no organization_id, and audit_logs' RLS insert
// policy (020_audit_log_self_insert.sql) requires one; the admin client
// bypasses RLS the same way it already does elsewhere for org-less
// platform actions (see admin/roles-actions.ts, admin/account-requests-actions.ts).
async function logSystemAction(actorId: string, action: string, entity: string, entityId?: string) {
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    organization_id: null,
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId ?? null,
  });
}

export async function createFeatureFlag(formData: FormData) {
  const { user } = await requireRole(["system_admin"]);

  const key = String(formData.get("key") ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!key || !label) throw new Error("Key and label are required.");

  const supabase = createClient();
  const { error } = await supabase.from("feature_flags").insert({
    key,
    label,
    description: description || null,
    enabled: false,
    updated_by: user.id,
  });
  if (error) throw new Error(error.message);

  await logSystemAction(user.id, `feature_flag_created: ${key}`, "feature_flags");
  revalidatePath("/system/flags");
}

export async function toggleFeatureFlag(formData: FormData) {
  const { user } = await requireRole(["system_admin"]);

  const id = String(formData.get("id") ?? "");
  const nextEnabled = String(formData.get("next_enabled") ?? "false") === "true";
  if (!id) throw new Error("Missing flag.");

  const supabase = createClient();
  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled: nextEnabled, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logSystemAction(user.id, `feature_flag_${nextEnabled ? "enabled" : "disabled"}`, "feature_flags", id);
  revalidatePath("/system/flags");
  // A flag can gate a page anywhere in the app — refresh everything so a
  // flip is visible immediately, not just on the flags screen itself.
  revalidatePath("/", "layout");
}

export async function deleteFeatureFlag(formData: FormData) {
  const { user } = await requireRole(["system_admin"]);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing flag.");

  const supabase = createClient();
  const { error } = await supabase.from("feature_flags").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logSystemAction(user.id, "feature_flag_deleted", "feature_flags", id);
  revalidatePath("/system/flags");
}
