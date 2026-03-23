/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a3a6e',
          50: '#eef2fb',
          100: '#d5e0f5',
          200: '#adc1eb',
          300: '#7a9add',
          400: '#4d74cb',
          500: '#2d57b8',
          600: '#1a3a6e',
          700: '#152f5a',
          800: '#0f2245',
          900: '#091630',
        },
        accent: {
          DEFAULT: '#f59e0b',
          light: '#fde68a',
          dark: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
