import type { Config } from "tailwindcss";

/**
 * Vespera AI — "Alabaster & Champagne Silk".
 * Tokens are defined as CSS variables in app/globals.css and mapped here so
 * both `bg-canvas` utilities and raw `var(--...)` work.
 */
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
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        canvas: "var(--surface-0)",
        pearl: "var(--surface-1)",
        elevated: "var(--surface-2)",
        stroke: "var(--border-subtle)",
        champagne: {
          DEFAULT: "var(--accent-primary)",
          soft: "var(--accent-secondary)",
        },
        espresso: "var(--text-primary)",
        slate: "var(--text-muted)",
        sage: "var(--state-success)",
        terracotta: "var(--state-flagged)",
        // shadcn/ui semantic aliases
        border: "var(--border-subtle)",
        input: "var(--border-subtle)",
        ring: "var(--accent-primary)",
        background: "var(--surface-0)",
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--accent-primary)",
          foreground: "var(--surface-0)",
        },
        secondary: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent-secondary)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--state-flagged)",
          foreground: "var(--surface-0)",
        },
        card: {
          DEFAULT: "var(--surface-1)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--surface-1)",
          foreground: "var(--text-primary)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Instrument Serif", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "20px",
        lg: "16px",
        md: "12px",
        sm: "8px",
        pill: "9999px",
      },
      letterSpacing: {
        tightish: "-0.02em",
      },
      boxShadow: {
        "card-inset": "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        glass: "0 8px 40px -12px rgba(26, 23, 21, 0.18)",
        "champagne-glow": "0 0 0 1px rgba(212, 163, 115, 0.3), 0 12px 48px -16px rgba(212, 163, 115, 0.45)",
      },
      backdropBlur: {
        glass: "16px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
