import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // JustWe brand: rose/pink for warmth + connection, deep green for trust/growth/community.
        // Kept muted and deep (not neon/candy) to stay mature rather than playful.
        brand: {
          // pink — used for primary CTAs, likes, accents
          50: "#fdf3f5",
          100: "#fbe4e9",
          200: "#f5c3ce",
          300: "#ec9bad",
          400: "#dd6d87",
          500: "#c94a68", // primary pink
          600: "#a83553",
          700: "#872a44",
          800: "#6e2439",
          900: "#5c2032",
        },
        forest: {
          // deep green — used for backgrounds, nav, trust elements, success states
          50: "#f2f7f4",
          100: "#e0ece4",
          200: "#bdd8c6",
          300: "#8fbc9e",
          400: "#5f9a73",
          500: "#427a57", // primary green
          600: "#336147",
          700: "#2a4e3a",
          800: "#233f30",
          900: "#1c3327",
        },
        ink: {
          50: "#f6f6f7",
          100: "#e2e3e6",
          400: "#71727a",
          600: "#42434b",
          800: "#25262c",
          900: "#161619",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(28, 51, 39, 0.08)",
        card: "0 2px 12px rgba(28, 51, 39, 0.10)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #f2f7f4 0%, #fdf3f5 55%, #fbe4e9 100%)",
        "brand-gradient-dark": "linear-gradient(135deg, #1c3327 0%, #233f30 60%, #2a4e3a 100%)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
