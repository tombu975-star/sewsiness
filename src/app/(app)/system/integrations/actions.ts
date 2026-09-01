"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

// See src/app/(app)/system/flags/actions.ts for why this uses the admin
// client rather than the session-bound one: System Admin has no
// organization_id, and audit_logs' RLS insert policy requires one.
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

/**
 * Presence-only health check: confirms the env vars a provider needs are
 * actually set on this deployment. It never reads or stores the secret
 * values themselves — only whether each expected variable is present and
 * non-empty. Real credentials live in Render's environment settings; this
 * table only ever sees "is PAYSTACK_SECRET_KEY set?", never the key.
 */
function checkEnvVars(requiredEnvVars: string[]): { ok: boolean; message: string } {
  if (requiredEnvVars.length === 0) return { ok: true, message: "No env vars required." };
  const missing = requiredEnvVars.filter((name) => !process.env[name] || process.env[name] === "");
  if (missing.length === 0) {
    return { ok: true, message: `All ${requiredEnvVars.length} required env var(s) are set.` };
  }
  return { ok: false, message: `Missing: ${missing.join(", ")}` };
}

export async function runIntegrationCheck(formData: FormData) {
  const { user } = await requireRole(["system_admin"]);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing integration.");

  const supabase = createClient();
  const { data: integration, error: fetchErr } = await supabase
    .from("integration_checks")
    .select("required_env_vars")
    .eq("id", id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const result = checkEnvVars((integration?.required_env_vars as string[]) ?? []);

  const { error } = await supabase
    .from("integration_checks")
    .update({
      status: result.ok ? "connected" : "error",
      last_checked_at: new Date().toISOString(),
      last_message: result.message,
      updated_by: user.id,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/system/integrations");
  revalidatePath("/system");
}

export async function addIntegration(formData: FormData) {
  const { user } = await requireRole(["system_admin"]);

  const provider_key = String(formData.get("provider_key") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  const provider_name = String(formData.get("provider_name") ?? "").trim();
  const category = String(formData.get("category") ?? "Other").trim() || "Other";
  const docs_url = String(formData.get("docs_url") ?? "").trim();
  const required_env_vars = String(formData.get("required_env_vars") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!provider_key || !provider_name) throw new Error("Provider key and name are required.");

  const supabase = createClient();
  const { error } = await supabase.from("integration_checks").insert({
    provider_key,
    provider_name,
    category,
    docs_url: docs_url || null,
    required_env_vars,
    updated_by: user.id,
  });
  if (error) throw new Error(error.message);

  await logSystemAction(user.id, `integration_added: ${provider_key}`, "integration_checks");
  revalidatePath("/system/integrations");
}

export async function removeIntegration(formData: FormData) {
  const { user } = await requireRole(["system_admin"]);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing integration.");

  const supabase = createClient();
  const { error } = await supabase.from("integration_checks").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logSystemAction(user.id, "integration_removed", "integration_checks", id);
  revalidatePath("/system/integrations");
}
