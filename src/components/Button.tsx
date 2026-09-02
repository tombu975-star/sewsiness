import Link from "next/link";

const VARIANTS: Record<string, string> = {
  primary: "bg-gold text-[#3a2400] hover:brightness-[1.03] border border-gold",
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
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const cls = `inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold px-4 py-2.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]}`;
  const style = { boxShadow: SHADOWS[variant] };
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}
