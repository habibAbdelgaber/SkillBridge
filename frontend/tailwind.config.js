/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#08306b",
          primary: "#2171b5",
          primaryHover: "#08519c",
          logo: "#08306b",
          muted: "#4292c6",
          borderLight: "#c6dbef",
          borderStrong: "#9ecae1",
          surface: "#deebf7",
          background: "#f7fbff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(8, 48, 107, 0.04), 0 4px 16px rgba(8, 48, 107, 0.06)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
