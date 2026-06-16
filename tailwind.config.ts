import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        brand: {
          50: "#e6f9f3",
          100: "#c6f1e3",
          200: "#8fe6cd",
          500: "#2ad7ad",
          600: "#13C8A0",
          700: "#0fa98a",
        },
        accent: {
          DEFAULT: "#ff2d55",
          soft: "#ffe5eb",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          subtle: "rgb(var(--surface-subtle) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        ok: "#34c759",
        warn: "#ff9500",
        danger: "#ff3b30",
        teal: "#32ade6",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(0,0,0,0.06)",
        fab: "0 6px 18px rgba(19,200,160,0.45)",
        hero: "0 2px 8px rgba(0,0,0,0.08)",
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #2ad7ad 0%, #13C8A0 55%, #0fa98a 100%)",
      },
      maxWidth: {
        app: "30rem",
      },
    },
  },
  plugins: [],
};

export default config;
