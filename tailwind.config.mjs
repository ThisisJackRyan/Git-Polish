/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#f5f4ff',
          100: '#ede9fe',
          200: '#e0e7ff',
          300: '#c7d2fe',
          400: '#a5b4fc',
          500: '#8b94f8',
          600: '#6366f1',
          700: '#4f46e5',
          800: '#4338ca',
          900: '#3730a3'
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
