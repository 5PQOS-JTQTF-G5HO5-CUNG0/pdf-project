/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f5f5f7",
        background: "#f5f5f7",
        surface: {
          1: "#ffffff",
          2: "#f5f5f7",
          3: "#e8e8ed",
          4: "#dcdce2",
        },
        hairline: {
          DEFAULT: "#e5e5e7",
          subtle: "rgba(0, 0, 0, 0.04)",
          strong: "#d2d2d7",
        },
        border: "#e5e5e7",
        ink: {
          DEFAULT: "#1d1d1f",
          muted: "#333336",
          subtle: "#86868b",
          tertiary: "#a1a1a6",
        },
        apple: {
          blue: "#0071e3",
          blueHover: "#0077ed",
          green: "#34c759",
          red: "#ff3b30",
          orange: "#ff9500",
          gray: "#f5f5f7",
          dark: "#1d1d1f",
        },
        primary: {
          DEFAULT: "#0071e3",
          hover: "#0077ed",
          focus: "#0062c4",
          dark: "#1d1d1f",
        },
        semantic: {
          success: "#34c759",
          warning: "#ff9500",
          error: "#ff3b30",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Text'",
          "'SF Pro Display'",
          "'Helvetica Neue'",
          "Roboto",
          "sans-serif",
        ],
        mono: ["'SF Mono'", "'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        apple: "0 2px 12px 0 rgba(0, 0, 0, 0.03)",
        "apple-card": "0 2px 16px -2px rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.02)",
        "apple-hover": "0 8px 24px -4px rgba(0, 0, 0, 0.06), 0 2px 6px 0 rgba(0, 0, 0, 0.03)",
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};
