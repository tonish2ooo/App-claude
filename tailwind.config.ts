import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f172a",
          soft: "#475569",
          muted: "#94a3b8",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8fafc",
          muted: "#f1f5f9",
        },
        ok: "#16a34a",
        warn: "#d97706",
        danger: "#dc2626",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)",
        fab: "0 8px 24px rgba(79,70,229,0.35)",
      },
      maxWidth: {
        app: "30rem",
      },
    },
  },
  plugins: [],
};

export default config;
