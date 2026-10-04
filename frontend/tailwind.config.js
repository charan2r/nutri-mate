/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        nutrio: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        brand: {
          green: '#10B981',
          'green-dark': '#059669',
          'green-light': '#34D399',
          amber: '#F59E0B',
          dark: '#0B0F0E',
          surface: '#141D1A',
          'surface-light': '#1D2A26',
          border: '#273832',
        },
      },
    },
  },
  plugins: [],
}