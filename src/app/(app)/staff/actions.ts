"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { isFrameworkSignal, type ActionState } from "@/lib/action-state";
import { toSafeErrorMessage } from "@/lib/db-error";
import { siteUrl } from "@/lib/site-url";
import type { Role } from "@/lib/types";

// Previously this action had NO caller-role check AND trusted the
// requested `role` straight from client form data with no allowlist —
// meaning any signed-in Staff account could invite a brand-new user
// with role: "owner" (or even "super_admin") and hand them the keys to
// the whole business. Both holes are closed below: only Owner/Manager
// may invite, and each caller may only grant roles at or below their
// own level.
//
// FIX: the invite form's Role dropdown offers Staff / Manager / Trainer,
// but "trainer" was missing from both allow-lists below — selecting it
// always failed with "You aren't allowed to assign that role.", which
// (before the useFormState change in this file) crashed the whole page
// to Next's generic "Application error" screen. This was the reliable
// repro for the enroll/invite crash.
const ROLES_INVITABLE_BY: Partial<Record<Role, Role[]>> = {
  owner: ["manager", "staff", "trainer"],
  manager: ["staff", "trainer"],
};

// Returns { error } instead of throwing — see staff/new/InviteStaffForm.tsx.
export async function inviteStaff(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { profile } = await requireRole(["owner", "manager"]);

    const full_name = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const requestedRole = String(formData.get("role") ?? "staff") as Role;
    if (!full_name || !email) return { error: "Name and email are required to send an invite." };

    const invitable = ROLES_INVITABLE_BY[profile.role as Role] ?? [];
    if (!invitable.includes(requestedRole)) {
      return { error: "You aren't allowed to assign that role." };
    }
    const role = requestedRole;

    const admin = createAdminClient();
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role },
      redirectTo: `${siteUrl()}/accept-invite`,
    });
    if (inviteErr) return { error: inviteErr.message };

    const { error: profileErr } = await admin.from("profiles").insert({
      id: invited.user.id,
      organization_id: profile.organization_id,
      branch_id: formData.get("branch_id") || profile.branch_id || null,
      full_name,
      role,
    });
    if (profileErr) return { error: toSafeErrorMessage(profileErr, "Couldn't finish creating that account. Please try again.") };
  } catch (err) {
    if (isFrameworkSignal(err)) throw err;
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
  }

  revalidatePath("/staff");
  redirect("/staff");
}
