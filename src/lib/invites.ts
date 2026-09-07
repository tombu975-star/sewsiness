// Shared by every "invite a person" server action (staff, freelancers,
// apprentices — see their respective actions.ts) and by the listing
// pages that show invite status + a Resend button. Keeping this in one
// place means the 30-minute window is a single number, not copy-pasted
// across three action files that could quietly drift apart.
//
// See supabase/migrations/032_invite_expiry_and_resend.sql for the
// `invites` table this backs.

export const INVITE_TTL_MINUTES = 30;

export function inviteExpiryTimestamp(): string {
  return new Date(Date.now() + INVITE_TTL_MINUTES * 60_000).toISOString();
}

export type InviteRow = {
  id: string;
  user_id: string;
  status: "pending" | "accepted" | "revoked";
  expires_at: string;
  resend_count?: number;
} | null | undefined;

// Records (or re-records, on resend) an invite. Best-effort: a failure
// here should never fail the invite itself — the person already has a
// working Supabase auth account and an email on the way; the worst
// case without this row is just that the listing page can't show a
// countdown/Resend button for them yet, so callers log and move on
// rather than surfacing this as an action error.
export async function recordInvite(
  admin: any,
  params: {
    organization_id: string;
    user_id: string;
    email: string;
    full_name: string;
    role: string;
    invited_by: string;
  }
) {
  const { error } = await admin.from("invites").upsert(
    {
      organization_id: params.organization_id,
      user_id: params.user_id,
      email: params.email,
      full_name: params.full_name,
      role: params.role,
      invited_by: params.invited_by,
      status: "pending",
      expires_at: inviteExpiryTimestamp(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[invites] failed to record invite row", error);
  }
}
