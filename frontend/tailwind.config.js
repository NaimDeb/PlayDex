// tailwind.config.js
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/components/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'off-black': '#1A1A1A',
        'off-gray': '#2D2D2D',
        'off-white': '#F0F0F0',
        'primary': '#4D40FF',
        'secondary': '#7173FF',
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};