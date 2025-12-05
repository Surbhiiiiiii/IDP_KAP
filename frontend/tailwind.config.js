/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ⭐ IMPORTANT — enables light/dark mode switching
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255,255,255,0.05)",       // light glass
        glassDark: "rgba(255,255,255,0.08)",   // dark glass
        glow: "rgba(168, 85, 247, 0.35)",       // purple-glow
      },

      backgroundImage: {
        "grad-primary": "linear-gradient(135deg, #a855f7, #ec4899)", // purple → pink
        "grad-accent": "linear-gradient(135deg, #6366f1, #a855f7)",  // indigo → purple
      },

      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.15)",
        glow: "0 0 20px rgba(168, 85, 247, 0.35)",
      },

      backdropBlur: {
        xs: "2px",
      },

      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        slideUp: "slideUp 0.4s ease-out",
        shimmer: "shimmer 1.5s infinite linear",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-450px 0" },
          "100%": { backgroundPosition: "450px 0" },
        },
      },
    },
  },
  plugins: [],
};
