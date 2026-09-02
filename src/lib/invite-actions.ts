"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { isFrameworkSignal } from "@/lib/action-state";
import { siteUrl } from "@/lib/site-url";
import { inviteExpiryTimestamp } from "@/lib/invites";

export type ResendInviteResult =
  | { error: string }
  | { ok: true; expiresAt: string; alreadyAccepted: boolean };

// Shared "Resend invite" action for the Staff, Freelancers and
// Apprentices pages (each renders <ResendInviteButton /> next to an
// invited row — see src/components/ResendInviteButton.tsx), and for
// Super Admin's platform-wide Users & Roles page (see
// src/app/(app)/admin/users/page.tsx), which can resend for any
// organization. Not tied to useFormState/a <form> since it's one button
// per table row rather than a page-level form; it's called directly
// from the client component instead and returns a plain result the
// button uses to show an inline message without navigating away from
// the list.
//
// Re-sending does NOT call inviteUserByEmail again — that only works
// once per address, before the account exists (see 033's header
// comment). And it deliberately does NOT use resetPasswordForEmail()
// either, even though that also works for an existing unconfirmed user:
// this app's forgot-password screen (see
// src/app/forgot-password/ForgotPasswordForm.tsx) has already
// repurposed Supabase's "Reset Password" email template to deliver a
// typed 6-digit code, not a clickable link — sending through that same
// template here would hand the invitee a code with no link to click,
// and /accept-invite only knows how to read a clicked link's URL
// fragment. signInWithOtp's "Magic Link" email is a separate,
// unmodified Supabase template that still contains a real link, so it's
// the one resend uses: same destination (/accept-invite), a brand-new
// token that supersedes whatever was issued before, no code involved.
//
// Resending an already-*accepted* invite is allowed too — that person
// already has an account and a password, so this isn't a second
// onboarding link, it's a fresh way back into /accept-invite's "set
// your password" screen (AcceptInviteForm lets an already-accepted
// user through regardless of expires_at — see its header comment).
// That's useful on its own as an admin-initiated password reset, so
// the invite row's status stays "accepted" (it's still true — the
// person did accept) and only resent_at/resend_count move; a *pending*
// invite keeps the original behaviour of extending expires_at another
// 30 minutes.
export async function resendInvite(inviteId: string, revalidate: string): Promise<ResendInviteResult> {
  try {
    const { profile, user } = await requireRole(["owner", "manager", "super_admin"]);
    const admin = createAdminClient();

    const { data: invite, error: fetchErr } = await admin
      .from("invites")
      .select("id, email, organization_id, status, resend_count, expires_at")
      .eq("id", inviteId)
      .single();
    if (fetchErr || !invite) return { error: "Couldn't find that invite. Refresh the page and try again." };
    // Super Admin can resend for any organization; Owner/Manager only
    // for their own.
    if (profile.role !== "super_admin" && invite.organization_id !== profile.organization_id) {
      return { error: "You don't have permission to do that." };
    }
    if (invite.status === "revoked") {
      return { error: "This invite was revoked — send a new one instead." };
    }

    const { error: sendErr } = await admin.auth.signInWithOtp({
      email: invite.email,
      options: {
        emailRedirectTo: `${siteUrl()}/accept-invite`,
        shouldCreateUser: false,
      },
    });
    if (sendErr) return { error: sendErr.message };

    const alreadyAccepted = invite.status === "accepted";
    const expiresAt = alreadyAccepted ? invite.expires_at : inviteExpiryTimestamp();
    const update: Record<string, unknown> = {
      resent_at: new Date().toISOString(),
      resend_count: (invite.resend_count ?? 0) + 1,
    };
    if (!alreadyAccepted) {
      update.status = "pending";
      update.expires_at = expiresAt;
    }
    await admin.from("invites").update(update).eq("id", inviteId);

    // organization_id comes from the invite itself, not the actor's own
    // profile — Super Admin has no organization_id of their own, and
    // for Owner/Manager it's already been confirmed to match above.
    await admin.from("audit_logs").insert({
      organization_id: invite.organization_id,
      actor_id: user.id,
      action: alreadyAccepted ? "invite_link_resent_after_acceptance" : "invite_resent",
      entity: "invites",
      entity_id: inviteId,
    });

    revalidatePath(revalidate);
    return { ok: true, expiresAt, alreadyAccepted };
  } catch (err) {
    if (isFrameworkSignal(err)) throw err;
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
  }
}
