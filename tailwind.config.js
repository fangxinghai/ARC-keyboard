/** @type {import('tailwindcss').Config} */
import trac from "tailwindcss-react-aria-components";
import contQueries from "@tailwindcss/container-queries";

export default {
  content: ["./index.html", "./download.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
    },
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        // ── Apple 风色彩系统 ─────────────────────────────
        primary: "light-dark(#007AFF, #0A84FF)",
        "primary-hover": "light-dark(#0066D6, #409CFF)",
        "primary-content": "light-dark(#FFFFFF, #FFFFFF)",

        secondary: "light-dark(#5856D6, #5E5CE6)",
        accent: "light-dark(#FF9500, #FF9F0A)",
        "accent-content": "light-dark(#FFFFFF, #1C1C1E)",

        success: "light-dark(#34C759, #30D158)",
        "success-content": "light-dark(#FFFFFF, #FFFFFF)",
        error: "light-dark(#FF3B30, #FF453A)",
        "error-content": "light-dark(#FFFFFF, #FFFFFF)",

        // ── 基础色（亮色纯白系 / 暗色纯黑系）──────────
        "base-content": "light-dark(#1C1C1E, #F5F5F7)",
        "base-100": "light-dark(#FFFFFF, #000000)",
        "base-200": "light-dark(#F2F2F7, #1C1C1E)",
        "base-300": "light-dark(#E5E5EA, #2C2C2E)",
        "base-400": "light-dark(#D1D1D6, #3A3A3C)",

        // ── 毛玻璃专用 ──────────────────────────────────
        "glass-bg": "light-dark(rgba(255,255,255,0.72), rgba(28,28,30,0.72))",
        "glass-border": "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))",
        "glass-bg-heavy": "light-dark(rgba(255,255,255,0.85), rgba(28,28,30,0.85))",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        "apple-sm": "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "apple": "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        "apple-lg": "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        "apple-xl": "0 16px 48px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
        "glow-primary": "0 0 20px rgba(0,122,255,0.3)",
        "glow-accent": "0 0 20px rgba(255,149,0,0.3)",
        "key": "0 1px 2px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.06) inset",
        "key-hover": "0 4px 12px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.08) inset",
        "key-active": "0 1px 4px rgba(0,122,255,0.4), 0 0 0 2px rgba(0,122,255,0.2)",
      },
      animation: {
        "gradient-shift": "gradient-shift 20s ease infinite",
        "blob-1": "blob-move-1 25s ease-in-out infinite",
        "blob-2": "blob-move-2 30s ease-in-out infinite",
        "blob-3": "blob-move-3 35s ease-in-out infinite",
        "blob-4": "blob-move-4 28s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.35s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16,1,0.3,1)",
        "tab-indicator": "tab-indicator 0.3s cubic-bezier(0.16,1,0.3,1)",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      keyframes: {
        "blob-move-1": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "25%": { transform: "translate(30%, -20%) scale(1.1)" },
          "50%": { transform: "translate(-10%, 30%) scale(0.9)" },
          "75%": { transform: "translate(-30%, -10%) scale(1.05)" },
        },
        "blob-move-2": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "33%": { transform: "translate(-25%, 25%) scale(1.15)" },
          "66%": { transform: "translate(20%, -15%) scale(0.85)" },
        },
        "blob-move-3": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1.05)" },
          "20%": { transform: "translate(15%, 20%) scale(0.95)" },
          "40%": { transform: "translate(-20%, 10%) scale(1.1)" },
          "60%": { transform: "translate(10%, -25%) scale(0.9)" },
          "80%": { transform: "translate(-15%, -10%) scale(1)" },
        },
        "blob-move-4": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(0.95)" },
          "25%": { transform: "translate(-20%, -20%) scale(1.1)" },
          "50%": { transform: "translate(25%, 15%) scale(1)" },
          "75%": { transform: "translate(10%, -20%) scale(1.05)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.16, 1, 0.3, 1)",
        "apple-bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      backdropBlur: {
        "apple": "20px",
        "apple-heavy": "40px",
      },
    },
    fontFamily: {
      keycap: ["-apple-system", "SF Pro Text", "Inter", "system-ui"],
    },
  },
  plugins: [contQueries, trac({ prefix: "rac" })],
};
