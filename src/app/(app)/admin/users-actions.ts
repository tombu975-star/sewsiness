"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuperAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") throw new Error("Only Super Admin can do this.");
  return user;
}

// Suspends a business member. This does not delete anything they created —
// it flags the profile so middleware blocks their session and future
// sign-ins until Super Admin reactivates them.
export async function suspendUser(formData: FormData) {
  const actor = await requireSuperAdmin();
  const targetId = String(formData.get("profile_id") ?? "");
  if (!targetId) throw new Error("Missing user.");
  if (targetId === actor.id) throw new Error("You can't suspend your own account.");

  const admin = createAdminClient();
  const { data: target, error: fetchErr } = await admin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", targetId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  if (target.role === "super_admin" || target.role === "system_admin") {
    throw new Error("Platform accounts (Super Admin / System Admin) can't be suspended here.");
  }

  const { error } = await admin.from("profiles").update({ suspended_at: new Date().toISOString() }).eq("id", targetId);
  if (error) throw new Error(error.message);

  if (target.organization_id) {
    await admin.from("audit_logs").insert({
      organization_id: target.organization_id,
      actor_id: actor.id,
      action: "User suspended",
      entity: "profile",
      entity_id: targetId,
    });
  }

  revalidatePath("/admin/users");
}

export async function reactivateUser(formData: FormData) {
  const actor = await requireSuperAdmin();
  const targetId = String(formData.get("profile_id") ?? "");
  if (!targetId) throw new Error("Missing user.");

  const admin = createAdminClient();
  const { data: target, error: fetchErr } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", targetId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const { error } = await admin.from("profiles").update({ suspended_at: null }).eq("id", targetId);
  if (error) throw new Error(error.message);

  if (target.organization_id) {
    await admin.from("audit_logs").insert({
      organization_id: target.organization_id,
      actor_id: actor.id,
      action: "User reactivated",
      entity: "profile",
      entity_id: targetId,
    });
  }

  revalidatePath("/admin/users");
}
