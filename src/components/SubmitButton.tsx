"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";

const VARIANTS: Record<string, string> = {
  primary: "bg-gold text-[#3a2400] hover:brightness-[1.03] border border-gold shadow-[var(--shadow-gold)]",
  outline: "border border-border-strong text-ink bg-surface hover:bg-sunken hover:border-ink-faint",
  danger: "bg-burgundy text-white hover:opacity-90 border border-burgundy",
};

// Drop-in replacement for a plain `<button type="submit">` inside a
// <form action={serverAction}>. Reads the enclosing form's pending state via
// useFormStatus, so it automatically shows a spinner and disables itself
// while the server action is running — no extra wiring needed per-form.
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "outline" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {pending && <Spinner />}
      {pending ? pendingLabel ?? "Saving…" : children}
    </button>
  );
}
