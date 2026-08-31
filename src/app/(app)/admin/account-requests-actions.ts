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

export async function markAccountRequestStatus(formData: FormData) {
  const actor = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["contacted", "converted", "dismissed"].includes(status)) {
    throw new Error("Invalid request.");
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("account_requests")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: actor.id })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/account-requests");
}

export async function resolveAccountRecoveryRequest(formData: FormData) {
  const actor = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Invalid request.");
  const admin = createAdminClient();
  const { error } = await admin
    .from("account_recovery_requests")
    .update({ resolved_at: new Date().toISOString(), resolved_by: actor.id })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/account-requests");
}
