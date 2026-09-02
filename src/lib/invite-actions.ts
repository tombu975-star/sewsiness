"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { isFrameworkSignal } from "@/lib/action-state";
import { siteUrl } from "@/lib/site-url";
import { inviteExpiryTimestamp } from "@/lib/invites";

export type ResendInviteResult = { error: string } | { ok: true; expiresAt: string };

// Shared "Resend invite" action for the Staff, Freelancers and
// Apprentices pages (each renders <ResendInviteButton /> next to a
// pending row — see src/components/ResendInviteButton.tsx). Not tied to
// useFormState/a <form> since it's one button per table row rather than
// a page-level form; it's called directly from the client component
// instead and returns a plain result the button uses to show an inline
// message without navigating away from the list.
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
export async function resendInvite(inviteId: string, revalidate: string): Promise<ResendInviteResult> {
  try {
    const { profile, user } = await requireRole(["owner", "manager"]);
    const admin = createAdminClient();

    const { data: invite, error: fetchErr } = await admin
      .from("invites")
      .select("id, email, organization_id, status, resend_count")
      .eq("id", inviteId)
      .single();
    if (fetchErr || !invite) return { error: "Couldn't find that invite. Refresh the page and try again." };
    if (invite.organization_id !== profile.organization_id) {
      return { error: "You don't have permission to do that." };
    }
    if (invite.status === "accepted") {
      return { error: "This invite was already accepted — nothing to resend." };
    }

    const { error: sendErr } = await admin.auth.signInWithOtp({
      email: invite.email,
      options: {
        emailRedirectTo: `${siteUrl()}/accept-invite`,
        shouldCreateUser: false,
      },
    });
    if (sendErr) return { error: sendErr.message };

    const expiresAt = inviteExpiryTimestamp();
    await admin
      .from("invites")
      .update({
        status: "pending",
        expires_at: expiresAt,
        resent_at: new Date().toISOString(),
        resend_count: (invite.resend_count ?? 0) + 1,
      })
      .eq("id", inviteId);

    await admin.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      action: "invite_resent",
      entity: "invites",
      entity_id: inviteId,
    });

    revalidatePath(revalidate);
    return { ok: true, expiresAt };
  } catch (err) {
    if (isFrameworkSignal(err)) throw err;
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." };
  }
}
