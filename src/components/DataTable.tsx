import Link from "next/link";

const VARIANTS: Record<string, string> = {
  primary: "bg-indigo text-white hover:brightness-110 border border-indigo",
  outline: "border border-border-strong text-ink bg-surface hover:bg-sunken hover:border-ink-faint",
  ghost: "text-ink-muted hover:text-ink hover:bg-sunken",
};

const SHADOWS: Record<string, string> = {
  primary: "var(--shadow-gold)",
  outline: "var(--shadow-xs)",
  ghost: "none",
};

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  // For icon-only buttons (no visible text in `children`) — without
  // this there's no way for a caller to give the button an accessible
  // name, and a screen reader falls back to reading nothing useful
  // (or the raw icon glyph) instead of what the button actually does.
  ariaLabel?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold px-4 py-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`;
  const style = { boxShadow: SHADOWS[variant] };
  if (href) {
    return (
      <Link href={href} className={cls} style={style} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style} aria-label={ariaLabel}>
      {children}
    </button>
  );
}