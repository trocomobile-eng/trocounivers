/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        troco: {
          primary: "#1ABEA3",
          "primary-600": "#108F7E",
          "primary-100": "#D1F3EA",
          "primary-50": "#E6F9F3",
          green: "#22C58B",
          teal: "#1ABEA3",
          ink: "#17212B",
          muted: "#6F7782",
          faint: "#94A3B8",
          bg: "#F6F9F8",
          card: "#FFFFFF",
          border: "#E7ECEB",
        },
      },
      backgroundImage: {
        "troco-gradient":
          "linear-gradient(135deg, #1ABEA3 0%, #22C58B 100%)",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(15, 23, 42, 0.06)",
        card: "0 4px 20px rgba(15, 23, 42, 0.08)",
        strong: "0 8px 32px rgba(15, 23, 42, 0.10)",
        glow: "0 6px 20px rgba(26, 190, 163, 0.22)",
      },
      borderRadius: {
        "troco-sm": "14px",
        "troco-md": "20px",
        "troco-lg": "24px",
        "troco-xl": "28px",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};