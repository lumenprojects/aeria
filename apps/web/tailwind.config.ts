import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", "[data-mode='dark']"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Fraunces", "Playfair Display", "serif"],
        body: ["Source Serif 4", "Spectral", "serif"],
        ui: ["Manrope", "IBM Plex Sans", "sans-serif"]
      },
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        border: "var(--border)"
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: [typography]
};
