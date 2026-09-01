"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";

const VARIANTS: Record<string, string> = {
  primary: "bg-gold text-[#3a2400] hover:brightness-105 border border-gold",
  outline: "border border-border-strong text-ink bg-surface hover:bg-sunken",
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-70 disabled:cursor-wait ${VARIANTS[variant]} ${className}`}
    >
      {pending && <Spinner />}
      {pending ? pendingLabel ?? "Saving…" : children}
    </button>
  );
}
