"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFrameworkSignal, type ActionState } from "@/lib/action-state";
import { toSafeErrorMessage } from "@/lib/db-error";
import { siteUrl } from "@/lib/site-url";

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

// Enrolls a brand-new business on the platform: creates the organization,
// a default "Main" branch, and invites the person who'll be its Owner.
// Uses the service-role admin client the same way staff invites do —
// Super Admin itself is never added as a member of the business.
// Returns { error } instead of throwing on failure, for use with
// useFormState — see admin/new/EnrollBusinessForm.tsx. A thrown Error
// here would previously crash the whole page to Next's generic digest
// error screen on anything as ordinary as a duplicate owner email.
export async function enrollBusiness(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let orgId: string;
  try {
    const enroller = await requireSuperAdmin();

    const businessName = String(formData.get("business_name") ?? "").trim();
    const region = String(formData.get("region") ?? "").trim();
    const plan = String(formData.get("plan") ?? "Standard");
    const ownerName = String(formData.get("owner_name") ?? "").trim();
    const ownerEmail = String(formData.get("owner_email") ?? "").trim();

    if (!businessName) return { error: "Business name is required." };
    if (!ownerName || !ownerEmail) {
      return { error: "Owner name and email are required to send an invite." };
    }

    const admin = createAdminClient();

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: businessName, region: region || null, plan })
      .select("id")
      .single();
    if (orgErr) return { error: toSafeErrorMessage(orgErr, "Couldn't create the business. Please try again.") };

    const { data: branch, error: branchErr } = await admin
      .from("branches")
      .insert({ organization_id: org.id, name: "Main", city: region || null })
      .select("id")
      .single();
    if (branchErr) return { error: toSafeErrorMessage(branchErr, "Couldn't set up the business's branch. Please try again.") };

    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(ownerEmail, {
      data: { full_name: ownerName, role: "owner" },
      redirectTo: `${siteUrl()}/accept-invite`,
    });
    if (inviteErr) {
      // Business + branch were already created — say so rather than
      // leaving a silent half-enrolled business with no explanation.
      return { error: `Business created, but the owner invite failed: ${inviteErr.message}` };
    }

    const { error: profileErr } = await admin.from("profiles").insert({
      id: invited.user.id,
      organization_id: org.id,
      branch_id: branch.id,
      full_name: ownerName,
      role: "owner",
    });
    if (profileErr) return { error: toSafeErrorMessage(profileErr, "Couldn't finish creating the owner's account. Please try again.") };

    await admin.from("audit_logs").insert({
      organization_id: org.id,
      actor_id: enroller.id,
      action: "Business enrolled",
      entity: "organization",
      entity_id: org.id,
    });

    orgId = org.id;
  } catch (err) {
    if (isFrameworkSignal(err)) throw err;
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
  }

  revalidatePath("/admin");
  redirect(`/admin/${orgId}`);
}

export async function pauseBusiness(formData: FormData) {
  const admin_user = await requireSuperAdmin();
  const orgId = String(formData.get("organization_id") ?? "");
  const nextStatus = String(formData.get("next_status") ?? "Paused");
  if (!orgId) throw new Error("Missing business.");

  const admin = createAdminClient();
  const { error } = await admin.from("organizations").update({ status: nextStatus }).eq("id", orgId);
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    organization_id: orgId,
    actor_id: admin_user.id,
    action: nextStatus === "Paused" ? "Business suspended" : "Business reactivated",
    entity: "organization",
    entity_id: orgId,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/${orgId}`);
}

export async function markAdvisoryNoteSeen(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const noteId = String(formData.get("note_id") ?? "");
  if (!noteId) return;

  // RLS ("org_leadership_mark_advisory_notes_seen") already restricts this
  // to notes addressed to the caller's own organization.
  await supabase.from("advisory_notes").update({ seen_at: new Date().toISOString() }).eq("id", noteId);
  revalidatePath("/dashboard");
}

export async function sendAdvisoryNote(formData: FormData) {
  const user = await requireSuperAdmin();
  const orgId = String(formData.get("organization_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!orgId || !message) throw new Error("Missing business or message.");

  const admin = createAdminClient();
  const { error } = await admin.from("advisory_notes").insert({
    organization_id: orgId,
    author_id: user.id,
    message,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/${orgId}`);
}

// Approves a self-signed-up business's Ghana Card + selfie review — this is
// the only thing that flips organizations.verification_status to 'verified'
// for a business that came through /signup (businesses Super Admin enrolls
// directly via enrollBusiness() above are already 'verified' by default —
// that enrollment path IS the verification).
export async function approveBusinessVerification(formData: FormData) {
  const reviewer = await requireSuperAdmin();
  const orgId = String(formData.get("organization_id") ?? "");
  if (!orgId) throw new Error("Missing business.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({
      verification_status: "verified",
      verification_reviewed_at: new Date().toISOString(),
      verification_reviewed_by: reviewer.id,
      verification_rejection_reason: null,
    })
    .eq("id", orgId);
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    organization_id: orgId,
    actor_id: reviewer.id,
    action: "Business identity verified",
    entity: "organization",
    entity_id: orgId,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/${orgId}`);
}

export async function rejectBusinessVerification(formData: FormData) {
  const reviewer = await requireSuperAdmin();
  const orgId = String(formData.get("organization_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!orgId) throw new Error("Missing business.");
  if (!reason) throw new Error("Give a reason so the owner knows what to fix.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({
      verification_status: "rejected",
      verification_reviewed_at: new Date().toISOString(),
      verification_reviewed_by: reviewer.id,
      verification_rejection_reason: reason,
    })
    .eq("id", orgId);
  if (error) throw new Error(error.message);

  await admin.from("audit_logs").insert({
    organization_id: orgId,
    actor_id: reviewer.id,
    action: "Business identity verification rejected",
    entity: "organization",
    entity_id: orgId,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/${orgId}`);
}
