// tailwind.config.js (Updated)
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#2b3f4a',
        'brand-accent': '#ffbd08',
        'brand-accent-secondary': '#3B82F6',
        'brand-bg': '#f7f7f7',
        'brand-border': '#d9d9d9',
      },
      // Add this fontFamily section
      fontFamily: {
        sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}