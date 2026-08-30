"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

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

  revalidatePath("/system/flags");
  // A flag can gate a page anywhere in the app — refresh everything so a
  // flip is visible immediately, not just on the flags screen itself.
  revalidatePath("/", "layout");
}

export async function deleteFeatureFlag(formData: FormData) {
  await requireRole(["system_admin"]);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing flag.");

  const supabase = createClient();
  const { error } = await supabase.from("feature_flags").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/system/flags");
}
