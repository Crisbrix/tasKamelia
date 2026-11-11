/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#09090B',
          900: '#0E0E11',
          850: '#131316',
          800: '#18181B',
          700: '#202024',
          600: '#2A2A2F',
        },
        kamelia: {
          DEFAULT: '#F43F5E',
          soft: '#FB7185',
          deep: '#E11D48',
        },
        neon: {
          green: '#10B981',
          blue: '#3B82F6',
          amber: '#F59E0B',
          violet: '#8B5CF6',
          orange: '#F97316',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 1px 2px rgba(0,0,0,0.35)',
        'glow-brand': '0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
        pop: '0 20px 48px -16px rgba(0,0,0,0.55)',
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
