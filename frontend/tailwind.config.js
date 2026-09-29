/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#059669', // Emerald 600 - Snackr Primary Green
          hover: '#047857',   // Emerald 700
          light: '#d1fae5',   // Emerald 100
          dark: '#065f46',    // Emerald 800
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f9fafb',     // Light gray background
          muted: '#f3f4f6',
          border: '#e5e7eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
