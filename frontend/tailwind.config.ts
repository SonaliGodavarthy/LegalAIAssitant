import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5bbfd",
          400: "#8094fa",
          500: "#5e6ef5",
          600: "#4a4fea",
          700: "#3d3fd0",
          800: "#3234a8",
          900: "#1a1f6e",
          950: "#0f1240",
        },
        gold: {
          50: "#fefdf0",
          100: "#fdf8d0",
          200: "#fbf09e",
          300: "#f8e463",
          400: "#f4d330",
          500: "#e8bd0e",
          600: "#c99408",
          700: "#a16b09",
          800: "#86550f",
          900: "#714612",
          950: "#422406",
        },
        parchment: {
          50: "#fdfaf5",
          100: "#faf3e5",
          200: "#f5e5c8",
          300: "#eed2a2",
          400: "#e4b872",
          500: "#dba04e",
          600: "#cd8836",
          700: "#ab6d2d",
          800: "#8a582a",
          900: "#714826",
          950: "#3d2210",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
        mono: ["'Courier New'", "Courier", "monospace"],
      },
      animation: {
        "pulse-dot": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        typing: "typing 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        typing: {
          "0%, 80%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
      },
      boxShadow: {
        legal:
          "0 4px 24px -2px rgba(15, 18, 64, 0.12), 0 2px 8px -1px rgba(15, 18, 64, 0.08)",
        "legal-lg":
          "0 12px 48px -4px rgba(15, 18, 64, 0.18), 0 4px 16px -2px rgba(15, 18, 64, 0.1)",
        glow: "0 0 20px rgba(94, 110, 245, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
