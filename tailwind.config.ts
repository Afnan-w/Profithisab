import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        bg: "var(--bg)",
        surface: "var(--surface)",
        raised: "var(--raised)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        line: "var(--line)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "var(--fg-soft)",
            "--tw-prose-headings": "var(--fg)",
            "--tw-prose-links": "var(--brand-link)",
            maxWidth: "68ch",
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
