"use client";

import { useState, useTransition } from "react";
import { resendInvite } from "@/lib/invite-actions";

// Renders for both pending and already-accepted invites (see
// resendInvite's header comment in @/lib/invite-actions) — the label
// and success copy just read differently depending on which, since
// resending to someone who already accepted isn't a second onboarding,
// it's effectively "send them a fresh link to set a new password."
export function ResendInviteButton({
  inviteId,
  revalidatePath,
  status,
}: {
  inviteId: string;
  revalidatePath: string;
  status?: "pending" | "accepted" | "revoked" | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const alreadyAccepted = status === "accepted";

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const res = await resendInvite(inviteId, revalidatePath);
      if ("error" in res) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: res.alreadyAccepted
            ? "Sent — they can use it to set a new password."
            : "Sent — new link valid for 30 minutes.",
        });
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 mt-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-[11px] font-semibold text-indigo hover:underline disabled:opacity-60 disabled:cursor-wait whitespace-nowrap"
      >
        {pending ? "Resending…" : alreadyAccepted ? "Resend link" : "Resend invite"}
      </button>
      {message && (
        <span className={`text-[10.5px] leading-tight ${message.type === "error" ? "text-danger" : "text-success"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
