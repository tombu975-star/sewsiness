"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePermission } from "../roles-actions";

export function PermissionToggle({
  role,
  module,
  action,
  scope,
  allowed,
}: {
  role: string;
  module: string;
  action: string;
  scope: string;
  allowed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <input
      type="checkbox"
      defaultChecked={allowed}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.checked;
        startTransition(async () => {
          const fd = new FormData();
          fd.set("role", role);
          fd.set("module", module);
          fd.set("action", action);
          fd.set("scope", scope);
          fd.set("allowed", String(next));
          await togglePermission(fd);
          router.refresh();
        });
      }}
      className="w-4 h-4 accent-gold disabled:opacity-50"
    />
  );
}
