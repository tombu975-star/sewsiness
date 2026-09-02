"use client";

import { useState, useTransition } from "react";
import { resendInvite } from "@/lib/invite-actions";

export function ResendInviteButton({ inviteId, revalidatePath }: { inviteId: string; revalidatePath: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const res = await resendInvite(inviteId, revalidatePath);
      if ("error" in res) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Sent — new link valid for 30 minutes." });
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
        {pending ? "Resending…" : "Resend invite"}
      </button>
      {message && (
        <span className={`text-[10.5px] leading-tight ${message.type === "error" ? "text-danger" : "text-success"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
