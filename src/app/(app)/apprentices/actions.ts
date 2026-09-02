"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { isFrameworkSignal, type ActionState } from "@/lib/action-state";
import { toSafeErrorMessage } from "@/lib/db-error";
import { siteUrl } from "@/lib/site-url";
import { recordInvite } from "@/lib/invites";

// Mirrors the RLS boundary already named on apprentice_profiles
// ("manager+ can write apprentice profiles") — previously this action
// had NO caller-role check at all, so any signed-in org member
// (including an apprentice or freelancer account) could invite new
// apprentices into the business.
//
// Returns { error } instead of throwing — see apprentices/new/InviteApprenticeForm.tsx.
export async function inviteApprentice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { profile, user } = await requireRole(["owner", "manager"]);

    const full_name = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    if (!full_name || !email) return { error: "Name and email are required to send an invite." };

    // Invite-and-set-password: same pattern as Staff (AUTH-005). This creates
    // the auth.users row immediately (unconfirmed) and emails a set-password
    // link — Supabase's default invite template, or your own if configured.
    const admin = createAdminClient();
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: "apprentice" },
      redirectTo: `${siteUrl()}/accept-invite`,
    });
    if (inviteErr) return { error: inviteErr.message };

    const newUserId = invited.user.id;

    const { error: profileErr } = await admin.from("profiles").insert({
      id: newUserId,
      organization_id: profile.organization_id,
      branch_id: profile.branch_id ?? null,
      full_name,
      role: "apprentice",
    });
    if (profileErr) return { error: toSafeErrorMessage(profileErr, "Couldn't finish creating that account. Please try again.") };

    const { error: apprenticeErr } = await admin.from("apprentice_profiles").insert({
      profile_id: newUserId,
      organization_id: profile.organization_id,
      trainer_id: formData.get("trainer_id") || null,
      start_date: formData.get("start_date") || null,
      training_level: formData.get("training_level") || null,
      specialisation: formData.get("specialisation") || null,
      training_goals: formData.get("training_goals") || null,
    });
    if (apprenticeErr) return { error: toSafeErrorMessage(apprenticeErr, "Couldn't save the apprentice record. Please try again.") };

    await recordInvite(admin, {
      organization_id: profile.organization_id,
      user_id: newUserId,
      email,
      full_name,
      role: "apprentice",
      invited_by: user.id,
    });

    await admin.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      action: "user_invited",
      entity: "profiles",
      entity_id: newUserId,
    });
  } catch (err) {
    if (isFrameworkSignal(err)) throw err;
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
  }

  revalidatePath("/apprentices");
  redirect("/apprentices");
}
