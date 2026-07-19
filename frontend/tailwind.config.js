/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0F19",       // page background - deep space navy
        surface: "#131A2A",    // card background
        surface2: "#1B2436",   // slightly lighter surface (hover states)
        border: "#26314A",
        primary: "#6C5CE7",    // electric violet - main accent
        secondary: "#00D9C0",  // cyan/teal - "agent thinking" glow
        warn: "#FFB020",       // amber - price drops / alerts
        textmain: "#E8ECF7",
        textdim: "#8B96AF",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(108, 92, 231, 0.35)",
        glowTeal: "0 0 20px rgba(0, 217, 192, 0.35)",
      },
    },
  },
  plugins: [],
};
