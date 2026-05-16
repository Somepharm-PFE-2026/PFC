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
        background: "var(--background)",
        foreground: "var(--foreground)",
        blue: {
          50: "#F0F9FE",
          100: "#E0F3FD",
          200: "#B9E5F9",
          300: "#7CD0F4",
          400: "#25ADE3",
          500: "#25ADE3", // Brand Color
          600: "#25ADE3", // Also Brand Color to catch all instances
          700: "#1E8FBC",
          800: "#176E91",
          900: "#0F465C",
        }
      },
    },
  },
  plugins: [],
};
export default config;
