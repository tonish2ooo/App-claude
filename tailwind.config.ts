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
          50: "#e5f2ff",
          100: "#cce4ff",
          200: "#99caff",
          500: "#0a84ff",
          600: "#007aff",
          700: "#0060d0",
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
        fab: "0 4px 16px rgba(0,122,255,0.35)",
        hero: "0 2px 8px rgba(0,0,0,0.08)",
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #007aff 0%, #0060d0 100%)",
      },
      maxWidth: {
        app: "30rem",
      },
    },
  },
  plugins: [],
};

export default config;
