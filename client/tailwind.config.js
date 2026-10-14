/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#06070A',
          900: '#0A0B10',
          850: '#0D0F15',
          800: '#12141C',
          700: '#191C26',
          600: '#232734',
        },
        kamelia: {
          DEFAULT: '#FF2E63',
          soft: '#FF5C86',
          deep: '#D4145A',
        },
        neon: {
          green: '#00E676',
          blue: '#00B0FF',
          amber: '#FFC400',
          violet: '#7C4DFF',
          orange: '#FF6B00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 18px 50px -20px rgba(0,0,0,0.9)',
        'glow-brand': '0 18px 60px -24px rgba(255,46,99,0.65)',
        pop: '0 24px 70px -28px rgba(0,0,0,0.95)',
      },
      backgroundImage: {
        'radial-fade':
          'radial-gradient(1000px 600px at 12% -10%, rgba(255,46,99,0.16), transparent 60%), radial-gradient(900px 520px at 92% 0%, rgba(0,176,255,0.14), transparent 55%), radial-gradient(800px 700px at 50% 120%, rgba(0,230,118,0.10), transparent 60%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.7)', opacity: '0.9' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite',
        pulseRing: 'pulseRing 0.7s ease-out forwards',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('light', 'html.light &');
    }),
  ],
};
