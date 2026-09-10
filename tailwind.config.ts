import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        sage: {
          DEFAULT: "rgb(var(--sage) / <alpha-value>)",
          deep: "rgb(var(--sage-deep) / <alpha-value>)",
          soft: "rgb(var(--sage-soft) / <alpha-value>)",
        },
        clay: {
          DEFAULT: "rgb(var(--clay) / <alpha-value>)",
          soft: "rgb(var(--clay-soft) / <alpha-value>)",
        },
        dusk: {
          DEFAULT: "rgb(var(--dusk) / <alpha-value>)",
          soft: "rgb(var(--dusk-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow) / 0.04), 0 8px 24px -12px rgb(var(--shadow) / 0.12)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.05), 0 16px 40px -16px rgb(var(--shadow) / 0.18)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(0.72)", opacity: "0.55" },
          "45%, 55%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
