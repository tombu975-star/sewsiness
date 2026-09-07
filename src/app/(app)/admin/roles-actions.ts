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

// Toggles one cell of the permission matrix. This writes to a real,
// RLS-protected table — but see the note at the top of
// 006_rbac_console.sql: it is a governance reference, not yet the live
// enforcement path, so this does not by itself change what the role can
// do in the app today.
export async function togglePermission(formData: FormData) {
  const actor = await requireSuperAdmin();
  const role = String(formData.get("role") ?? "");
  const module_ = String(formData.get("module") ?? "");
  const action = String(formData.get("action") ?? "");
  const scope = String(formData.get("scope") ?? "");
  const allowed = String(formData.get("allowed") ?? "false") === "true";
  if (!role || !module_ || !action || !scope) throw new Error("Missing permission cell.");

  const admin = createAdminClient();
  const { error } = await admin.from("role_permissions").upsert(
    {
      role,
      module: module_,
      action,
      scope,
      allowed,
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
    },
    { onConflict: "role,module,action" }
  );
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    organization_id: null,
    actor_id: actor.id,
    action: `permission_matrix_updated: ${role}.${module_}.${action}=${allowed}`,
    entity: "role_permissions",
  });

  revalidatePath("/admin/roles");
}
