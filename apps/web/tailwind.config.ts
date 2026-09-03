import type { Config } from "tailwindcss";

/** Vespera — dark kinetic. Token names stable; values in app/globals.css. */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        canvas: "var(--surface-0)",
        pearl: "var(--surface-1)",
        elevated: "var(--surface-2)",
        raised: "var(--surface-3)",
        ink: "var(--surface-ink)",
        stroke: "var(--border-subtle)",
        hairline: "var(--border-hair)",

        champagne: {
          DEFAULT: "var(--accent-primary)",
          soft: "var(--accent-strong)",
          strong: "var(--accent-strong)",
          dim: "var(--accent-dim)",
        },
        amber: "var(--accent-primary)",
        gold: "var(--accent-primary)",
        coral: "var(--accent-coral)",
        pink: "var(--accent-pink)",

        espresso: "var(--text-primary)",
        "ink-strong": "var(--text-strong)",
        slate: "var(--text-muted)",
        faint: "var(--text-faint)",
        cream: "var(--text-on-ink)",

        sage: "var(--state-success)",
        terracotta: "var(--state-flagged)",

        border: "var(--border-subtle)",
        input: "var(--border-subtle)",
        ring: "var(--accent-primary)",
        background: "var(--surface-0)",
        foreground: "var(--text-primary)",
        primary: { DEFAULT: "var(--accent-primary)", foreground: "var(--text-on-accent)" },
        secondary: { DEFAULT: "var(--surface-2)", foreground: "var(--text-primary)" },
        muted: { DEFAULT: "var(--surface-2)", foreground: "var(--text-muted)" },
        accent: { DEFAULT: "var(--accent-primary)", foreground: "var(--text-on-accent)" },
        destructive: { DEFAULT: "var(--state-flagged)", foreground: "#1a0a08" },
        card: { DEFAULT: "var(--surface-1)", foreground: "var(--text-primary)" },
        popover: { DEFAULT: "var(--surface-1)", foreground: "var(--text-primary)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Bricolage Grotesque", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Hanken Grotesque", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-1": ["clamp(3rem, 8vw, 6rem)", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
        "display-2": ["clamp(2.25rem, 5vw, 3.75rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-3": ["clamp(1.75rem, 3vw, 2.5rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        card: "14px",
        lg: "12px",
        md: "10px",
        sm: "7px",
        pill: "9999px",
      },
      letterSpacing: {
        tightish: "-0.025em",
        editorial: "-0.035em",
      },
      boxShadow: {
        overlay: "var(--shadow-overlay)",
        glass: "none",
        "champagne-glow": "0 18px 50px -18px rgba(233,178,76,0.45)",
      },
      backdropBlur: { glass: "14px" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "70%": { transform: "scale(2.2)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "gold-drift": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%,-3%,0) scale(1.06)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-ring": "pulse-ring 2.8s cubic-bezier(0.16,1,0.3,1) infinite",
        shimmer: "shimmer 1.8s infinite",
        marquee: "marquee 34s linear infinite",
        "gold-drift": "gold-drift 16s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
