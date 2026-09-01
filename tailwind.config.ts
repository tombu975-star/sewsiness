import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        sunken: "var(--sunken)",
        ink: { DEFAULT: "var(--ink)", muted: "var(--ink-muted)", faint: "var(--ink-faint)", soft: "var(--ink-soft)" },
        gold: { DEFAULT: "var(--gold)", soft: "var(--gold-soft)", ink: "var(--gold-ink)" },
        indigo: { DEFAULT: "var(--indigo)", soft: "var(--indigo-soft)", 2: "var(--indigo2)" },
        burgundy: { DEFAULT: "var(--burgundy)", soft: "var(--burgundy-soft)" },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)" },
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
        border: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
        sidebar: { DEFAULT: "var(--sidebar)", border: "var(--sidebar-border)", ink: "var(--sidebar-ink)", active: "var(--sidebar-active)" },
      },
      fontFamily: {
        display: ["var(--font-poppins)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm: "0.625rem",
        lg: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
