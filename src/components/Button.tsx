import Link from "next/link";

const VARIANTS: Record<string, string> = {
  primary: "text-white border border-transparent hover:brightness-110",
  accent: "text-white border border-transparent hover:brightness-110",
  outline: "border border-border-strong text-ink bg-surface hover:bg-sunken hover:border-ink-faint",
  ghost: "text-ink-muted hover:text-ink hover:bg-sunken",
};

const BACKGROUNDS: Record<string, string> = {
  primary: "var(--grad-brand)",
  accent: "var(--grad-amber)",
};

const SHADOWS: Record<string, string> = {
  primary: "var(--glow-brand)",
  accent: "var(--glow-amber)",
  outline: "var(--shadow-xs)",
  ghost: "none",
};

// Gradient variants get the diagonal shine sweep on hover (see .btn-shine
// in globals.css); flat variants (outline/ghost) skip it since a shine
// pass only reads as "premium" against a saturated fill.
const SHINE_VARIANTS = new Set(["primary", "accent"]);

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
  variant?: "primary" | "accent" | "outline" | "ghost";
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
  const shine = SHINE_VARIANTS.has(variant) ? "btn-shine" : "";
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold px-4 py-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo2 focus-visible:ring-offset-2 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${shine} ${className}`;
  const style = {
    boxShadow: SHADOWS[variant],
    ...(BACKGROUNDS[variant] ? { backgroundImage: BACKGROUNDS[variant] } : {}),
  };
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
