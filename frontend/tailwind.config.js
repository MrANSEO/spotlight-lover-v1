/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f3f0ff',
          100: '#e9e4ff',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
        },
      },
    },
  },
  plugins: [],
};
