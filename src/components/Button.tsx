import Link from "next/link";

const VARIANTS: Record<string, string> = {
  primary: "bg-gold text-[#3a2400] hover:brightness-105 border border-gold",
  outline: "border border-border-strong text-ink bg-surface hover:bg-sunken",
  ghost: "text-ink-muted hover:text-ink",
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
  const cls = `inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-50 ${VARIANTS[variant]}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
