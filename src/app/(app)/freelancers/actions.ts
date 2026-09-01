"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { isFrameworkSignal, type ActionState } from "@/lib/action-state";
import { toSafeErrorMessage } from "@/lib/db-error";
import { siteUrl } from "@/lib/site-url";

// Mirrors the RLS boundary already named on freelancer_profiles
// ("manager+ can write freelancer profiles") — previously this action
// had NO caller-role check at all, so any signed-in org member
// (including an apprentice or freelancer account) could invite new
// freelancers into the business.
//
// Returns { error } instead of throwing — see freelancers/new/InviteFreelancerForm.tsx.
export async function inviteFreelancer(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { profile, user } = await requireRole(["owner", "manager"]);

    const full_name = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    if (!full_name || !email) return { error: "Name and email are required to send an invite." };

    const admin = createAdminClient();
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: "freelancer" },
      redirectTo: `${siteUrl()}/accept-invite`,
    });
    if (inviteErr) return { error: inviteErr.message };

    const newUserId = invited.user.id;

    const { error: profileErr } = await admin.from("profiles").insert({
      id: newUserId,
      organization_id: profile.organization_id,
      branch_id: profile.branch_id ?? null,
      full_name,
      role: "freelancer",
    });
    if (profileErr) return { error: toSafeErrorMessage(profileErr, "Couldn't finish creating that account. Please try again.") };

    const { error: freelancerErr } = await admin.from("freelancer_profiles").insert({
      profile_id: newUserId,
      organization_id: profile.organization_id,
      whatsapp: formData.get("whatsapp") || null,
      location: formData.get("location") || null,
      primary_skill: formData.get("primary_skill") || null,
      years_experience: formData.get("years_experience") ? Number(formData.get("years_experience")) : null,
      specialisation: formData.get("specialisation") || null,
    });
    if (freelancerErr) return { error: toSafeErrorMessage(freelancerErr, "Couldn't save the freelancer record. Please try again.") };

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

  revalidatePath("/freelancers");
  redirect("/freelancers");
}
