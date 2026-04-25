/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1DB954",
          light: "#1ED760",
          dark: "#1AA34A",
        },
        background: {
          DEFAULT: "#F8FAFC",
          light: "#EEF2F7",
          lighter: "#E2E8F0",
          dark: "#121212",
          "dark-light": "#181818",
          "dark-lighter": "#282828",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          light: "#F1F5F9",
          lighter: "#E2E8F0",
          dark: "#282828",
          "dark-light": "#3E3E3E",
          "dark-lighter": "#4A4A4A",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          tertiary: "#94A3B8",
          "primary-dark": "#FFFFFF",
          "secondary-dark": "#B3B3B3",
          "tertiary-dark": "#6A6A6A",
        },
        accent: {
          DEFAULT: "#1DB954",
          red: "#F44336",
          yellow: "#FFC107",
        },
      },
    },
  },
  plugins: [],
};
