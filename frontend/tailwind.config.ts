import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0faf6",
          100: "#dcf4ea",
          500: "#3BA27A",
          600: "#2d8a65",
          700: "#236e50",
        },
      },
    },
  },
  plugins: [],
};
export default config;
