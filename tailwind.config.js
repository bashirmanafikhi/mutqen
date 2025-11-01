/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontSize: {
        "app-sm": 14,
        "app-md": 16,
        "app-lg": 18,
        "app-xl": 22,
      },

      fontFamily: {
        uthmanic: ['uthmanic_hafs1_ver13'],
        calibri: ['calibri'],
        times: ['times_new_roman'],
      },

      colors: {
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        primary: {
          DEFAULT: '#4f46e5',
          light: '#818cf8',
          dark: '#3730a3',
        },
        accent: {
          DEFAULT: '#10b981',
        },
      },
    },
  },
  plugins: [],
};
