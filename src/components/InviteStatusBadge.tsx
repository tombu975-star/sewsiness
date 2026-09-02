"use client";

import { useEffect, useState } from "react";

// Ticks its own countdown client-side (rather than printing a static
// server-rendered string) so "expires in 12m" doesn't quietly go stale
// while an Owner leaves the Staff/Freelancers/Apprentices tab open —
// the whole point of a 30-minute window is that it visibly runs out.
export function InviteStatusBadge({
  status,
  expiresAt,
}: {
  status?: "pending" | "accepted" | "revoked" | null;
  expiresAt?: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "pending" || !expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [status, expiresAt]);

  // Accepted → they're just a normal team member now; an established
  // Owner account (created before this feature existed) has no invite
  // row at all. Either way, nothing to show.
  if (!status || status === "accepted") return null;

  if (status === "pending" && expiresAt) {
    const msLeft = new Date(expiresAt).getTime() - now;
    if (msLeft <= 0) {
      return (
        <span className="badge bg-danger-soft text-danger whitespace-nowrap">
          <Dot color="var(--danger)" />
          Invite expired
        </span>
      );
    }
    const minsLeft = Math.max(1, Math.ceil(msLeft / 60_000));
    return (
      <span className="badge bg-warning-soft text-warning whitespace-nowrap">
        <Dot color="var(--warning)" />
        Pending · {minsLeft}m left
      </span>
    );
  }

  return (
    <span className="badge bg-sunken text-ink-muted whitespace-nowrap">
      <Dot color="var(--ink-faint)" />
      {status === "revoked" ? "Invite revoked" : "Invite pending"}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="w-[5px] h-[5px] rounded-full mr-1.5 flex-shrink-0 inline-block" style={{ background: color }} />;
}
