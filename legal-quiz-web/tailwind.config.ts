import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "rgb(248 250 252)",
          dark: "rgb(2 6 23)"
        }
      }
    }
  },
  plugins: []
} satisfies Config;

