/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cosmos: {
          950: '#060912',
          900: '#0b0820',
          800: '#15103a',
          700: '#1f1958',
          600: '#352a78',
          500: '#4b3fb0',
          400: '#7d6fff',
          300: '#a99bff',
          200: '#d4cff5',
          100: '#ece9ff',
        },
        gold: {
          400: '#f6c560',
          500: '#e6a82f',
          600: '#a8771a',
        },
        bronze: {
          400: '#d18a5b',
          500: '#a4612f',
        },
        steel: {
          400: '#9aa6b8',
          500: '#5d6a80',
        },
        shadow: {
          500: '#3a1240',
          700: '#1a0420',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        cosmos: '0 0 24px rgba(125, 111, 255, 0.45)',
        gold: '0 0 24px rgba(246, 197, 96, 0.55)',
        shadowGlow: '0 0 24px rgba(170, 60, 200, 0.55)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 0 rgba(125,111,255,0))' },
          '50%': { filter: 'drop-shadow(0 0 12px rgba(125,111,255,0.7))' },
        },
      },
      animation: {
        floaty: 'floaty 3s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
