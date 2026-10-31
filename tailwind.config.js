/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './index.dev.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ]
      },
      colors: {
        brand: {
          50: '#eefbf3',
          100: '#d6f5e3',
          200: '#b0eacb',
          300: '#7cdba8',
          400: '#3ec47c',
          500: '#0a9950',
          600: '#057c3f',
          700: '#046332',
          800: '#064f2a',
          900: '#054123'
        },
        canvas: '#F5FAF7'
      },
      boxShadow: {
        ambient:
          '0 10px 36px -10px rgba(6, 79, 42, 0.06), 0 2px 10px -3px rgba(15, 23, 42, 0.03)',
        'ambient-hover':
          '0 18px 46px -12px rgba(5, 124, 63, 0.12), 0 4px 14px -4px rgba(15, 23, 42, 0.04)',
        tooltip:
          '0 16px 38px -8px rgba(15, 23, 42, 0.15), 0 4px 12px -4px rgba(5, 124, 63, 0.08)'
      }
    }
  },
  plugins: []
};
