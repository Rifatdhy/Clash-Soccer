import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette - Monochromatic with accent
        charcoal: "#1a1a1a",
        elevated: "#242424",
        surface: "#2a2a2a",
        border: "#404040",
        accent: {
          DEFAULT: "#fef9f3",
          subtle: "#f5f0eb",
        },
        // Text colors
        "primary-text": "#fef9f3",
        "secondary-text": "#a8a8a8",
        "muted-text": "#707070",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-oswald)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(3.5rem, 8vw, 8rem)", { lineHeight: "0.9", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 6rem)", { lineHeight: "0.9", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(2rem, 4vw, 4rem)", { lineHeight: "1", letterSpacing: "-0.01em" }],
      },
      spacing: {
        "section": "clamp(4rem, 8vw, 8rem)",
      },
      maxWidth: {
        "content": "1280px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;