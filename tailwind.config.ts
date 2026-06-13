import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1c1430",
          soft: "#6b6480",
          muted: "#a09bb0",
        },
        brand: {
          50: "#f3f0ff",
          100: "#e9e3ff",
          200: "#d6caff",
          500: "#8b6df0",
          600: "#6d4ef0",
          700: "#5a3ee0",
        },
        accent: {
          DEFAULT: "#f43f7e",
          soft: "#fde6ee",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f6f5fb",
          muted: "#f1eff8",
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
        card: "0 1px 2px rgba(28,20,48,0.04), 0 8px 24px rgba(28,20,48,0.06)",
        fab: "0 10px 24px rgba(109,78,240,0.45)",
        hero: "0 16px 40px rgba(109,78,240,0.35)",
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #7c5cfc 0%, #6d4ef0 55%, #5a3ee0 100%)",
      },
      maxWidth: {
        app: "30rem",
      },
    },
  },
  plugins: [],
};

export default config;
