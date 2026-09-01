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

export async function verifyFreelancer(formData: FormData) {
  const actor = await requireSuperAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) throw new Error("Missing freelancer.");

  const admin = createAdminClient();
  const { data: freelancer, error: fetchErr } = await admin
    .from("freelancer_profiles")
    .select("organization_id")
    .eq("profile_id", profileId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const { error } = await admin
    .from("freelancer_profiles")
    .update({ verified_at: new Date().toISOString() })
    .eq("profile_id", profileId);
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    organization_id: freelancer.organization_id,
    actor_id: actor.id,
    action: "Freelancer verified",
    entity: "freelancer_profile",
    entity_id: profileId,
  });

  revalidatePath("/admin/freelancers");
}

export async function unverifyFreelancer(formData: FormData) {
  const actor = await requireSuperAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) throw new Error("Missing freelancer.");

  const admin = createAdminClient();
  const { data: freelancer, error: fetchErr } = await admin
    .from("freelancer_profiles")
    .select("organization_id")
    .eq("profile_id", profileId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const { error } = await admin.from("freelancer_profiles").update({ verified_at: null }).eq("profile_id", profileId);
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    organization_id: freelancer.organization_id,
    actor_id: actor.id,
    action: "Freelancer verification revoked",
    entity: "freelancer_profile",
    entity_id: profileId,
  });

  revalidatePath("/admin/freelancers");
}
