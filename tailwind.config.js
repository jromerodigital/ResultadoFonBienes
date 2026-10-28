/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
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
          500: '#0a9950',
          600: '#057c3f',
          700: '#046332',
          800: '#064f2a',
          900: '#054123'
        },
        canvas: '#FAFAFA'
      },
      boxShadow: {
        ambient: '0 10px 40px -10px rgba(15, 23, 42, 0.04), 0 2px 10px -3px rgba(15, 23, 42, 0.02)',
        'ambient-hover': '0 16px 48px -12px rgba(15, 23, 42, 0.07), 0 4px 14px -4px rgba(15, 23, 42, 0.03)',
        tooltip: '0 14px 36px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -4px rgba(15, 23, 42, 0.05)'
      }
    }
  },
  plugins: []
};

